"use client";

import { useState } from "react";
import { resolveReport } from "@/app/actions/resolvereport";
import { useRouter } from "next/navigation";

export default function ResolveButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleResolve() {
    setLoading(true);
    await resolveReport(reportId);
    router.refresh();
  }

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="shrink-0 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
    >
      {loading ? "..." : "Tandai Selesai"}
    </button>
  );
}
