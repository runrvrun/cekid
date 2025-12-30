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

        const validated = schema.parse({ email, password });

        await db.user.create({
          data: {
            email: validated.email.toLowerCase(),
            password: hashPassword(validated.password),
            name: (formData.get("name") as string) ?? "NA",
          },
        });
      } catch (err) {
        // Prisma-specific error handling
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

        // Zod validation errors
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
