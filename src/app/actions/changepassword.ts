"use server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Semua field wajib diisi." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password baru minimal 8 karakter." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Konfirmasi password tidak cocok." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    return {
      success: false,
      error: "Akun ini menggunakan login Google dan tidak memiliki password.",
    };
  }

  if (user.password !== hashPassword(currentPassword)) {
    return { success: false, error: "Password saat ini salah." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashPassword(newPassword) },
  });

  return { success: true, message: "Password berhasil diubah." };
}
