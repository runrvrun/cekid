"use client";

import { useState } from "react";
import { changeProductStatus } from "@/app/actions/changeproductstatus";

type Status = "ACTIVE" | "PENDING" | "INACTIVE";

const options: { value: Status; label: string }[] = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "PENDING", label: "Pending" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export default function ProductStatusButton({
  productId,
  currentStatus,
}: {
  productId: string;
  currentStatus: Status;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(currentStatus);

  async function handleChange(newStatus: Status) {
    if (newStatus === status) return;
    setLoading(true);
    const result = await changeProductStatus(productId, newStatus);
    if (!result.error) setStatus(newStatus);
    setLoading(false);
  }

  const color: Record<Status, string> = {
    ACTIVE: "text-green-700 bg-green-50 border-green-200",
    PENDING: "text-orange-700 bg-orange-50 border-orange-200",
    INACTIVE: "text-gray-500 bg-gray-50 border-gray-200",
  };

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as Status)}
      className={`text-xs font-medium border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 ${color[status]}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
