"use client";

import { useState } from "react";
import { changeRole } from "@/app/actions/changerole";

const roles = ["USER", "MODERATOR", "ADMIN"] as const;
type Role = (typeof roles)[number];

export default function ChangeRoleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>(currentRole);

  async function handleChange(newRole: Role) {
    if (newRole === role) return;
    setLoading(true);
    const result = await changeRole(userId, newRole);
    if (!result.error) setRole(newRole);
    setLoading(false);
  }

  return (
    <select
      value={role}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white"
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {r === "USER" ? "User" : r === "MODERATOR" ? "Moderator" : "Admin"}
        </option>
      ))}
    </select>
  );
}
