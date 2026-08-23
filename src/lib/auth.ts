import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { schema } from "@/lib/schema";

const adapter = PrismaAdapter(prisma);

/**
 * Defensive final safety net: recursively converts any stray `bigint` to a
 * string before a callback return value can reach Auth.js's internal
 * JSON.stringify (which throws on BigInt, e.g. "Do not know how to
 * serialize a BigInt"). Covers any future column added to a model that
 * flows through these callbacks, not just the ones we know about today.
 */
function stripBigInt<T>(value: T): T {
  if (typeof value === "bigint") {
    return value.toString() as unknown as T;
  }
  if (value === null || typeof value !== "object" || value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => stripBigInt(v)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = stripBigInt(v);
  }
  return out as T;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    allowDangerousEmailAccountLinking: true,
  }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedCredentials = schema.parse(credentials);

        const user = await prisma.user.findFirst({
          where: {
            email: validatedCredentials.email,
            password: hashPassword(validatedCredentials.password as string),
          },
        });

        if (!user) return null;
        if (user.status === "SUSPENDED") return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { status: true },
      });
      if (dbUser?.status === "SUSPENDED") return false;
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return stripBigInt(token);
    },
    // For database sessions, Auth.js pre-populates session.user with the
    // ENTIRE raw adapter User row before this callback runs — including any
    // column that isn't JSON-serializable (e.g. BigInt). Replace it wholesale
    // with an explicit whitelist rather than mutating fields on top of it,
    // then run it through stripBigInt as a final safety net regardless.
    async session({ session, user }) {
      return stripBigInt({
        ...session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role ?? "USER",
        },
      });
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});