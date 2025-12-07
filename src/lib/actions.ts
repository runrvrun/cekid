import { schema } from "@/lib/schema";
import db from "@/lib/prisma";
import { executeAction } from "@/lib/executeAction";
import { hashPassword } from "@/lib/hash";
import { v4 as uuid } from "uuid";

const signUp = async (formData: FormData) => {
  return executeAction({
    actionFn: async () => {
      const email = formData.get("email");
      const password = formData.get("password");
      const hashedPassword = hashPassword(password as string);
      const validatedData = schema.parse({ email, password });
      
      await db.user.create({
        data: {
          id: uuid(),
          email: validatedData.email.toLocaleLowerCase(),
          password: hashedPassword,
          name: formData.get("name") as string,
        },
      }); 
    },
    successMessage: "Signed up successfully",
  });
};

export { signUp };