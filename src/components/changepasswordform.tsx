"use client";

import { useState } from "react";
import { changePassword } from "@/app/actions/changepassword";

type Props = {
  hasPassword: boolean;
};

export default function ChangePasswordForm({ hasPassword }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!hasPassword) {
    return (
      <div className="rounded-lg bg-base-200 p-4 text-sm text-base-content/70">
        Akun Anda menggunakan login Google dan tidak memiliki password.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("currentPassword", currentPassword);
      fd.append("newPassword", newPassword);
      fd.append("confirmPassword", confirmPassword);

      const result = await changePassword(fd);

      if (!result.success) {
        setError(result.error ?? "Gagal mengubah password.");
      } else {
        setSuccess(result.message ?? "Password berhasil diubah.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Password Saat Ini
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input input-bordered w-full"
          required
          autoComplete="current-password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password Baru</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input input-bordered w-full"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-base-content/50 mt-1">Minimal 8 karakter.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Konfirmasi Password Baru
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input input-bordered w-full"
          required
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? "Menyimpan..." : "Ubah Password"}
      </button>
    </form>
  );
}
