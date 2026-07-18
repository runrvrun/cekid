"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeProductStatus } from "@/app/actions/changeproductstatus";

export default function ApproveProductButton({
  productId,
}: {
  productId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await changeProductStatus(productId, "ACTIVE");
    setLoading(false);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={loading}
      className="text-xs font-medium px-2.5 py-1 rounded-full text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 disabled:opacity-50"
    >
      {loading ? "Menyetujui..." : "Setujui Produk"}
    </button>
  );
}
