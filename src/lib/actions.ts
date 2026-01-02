import { Prisma } from "@prisma/client";
import { schema } from "@/lib/schema";
import db from "@/lib/prisma";
import { executeAction } from "@/lib/executeAction";
import { hashPassword } from "@/lib/hash";

const signUp = async (formData: FormData) => {
  return executeAction({
    actionFn: async () => {
      try {
        const email = formData.get("email");
        const password = formData.get("password");
        const name = (formData.get("name") as string) ?? "NA";

        const validated = schema.parse({ email, password });

        const normalizedEmail = validated.email.toLowerCase();

        // ✅ 1. Check if email already exists
        const existingUser = await db.user.findFirst({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (existingUser) {
          throw new Error("Email already registered");
        }

        // ✅ 2. Create user
        await db.user.create({
          data: {
            email: normalizedEmail,
            password: hashPassword(validated.password),
            name,
          },
        });
      } catch (err) {
        // ✅ Prisma-specific fallback (race condition safety)
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          switch (err.code) {
            case "P2002":
              throw new Error("Email already registered");
            case "P2003":
              throw new Error("Invalid reference data");
            default:
              throw new Error("Database error");
          }
        }

        if (err instanceof Error) {
          throw err;
        }

        throw new Error("Unexpected error occurred");
      }
    },
    successMessage: "Signed up successfully",
  });
};

export { signUp };
