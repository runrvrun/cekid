import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import UlasanForm from "../../ulasan-form";

export default async function EditUlasanPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const post = await prisma.ulasan.findUnique({
    where: { id: BigInt(id) },
    select: {
      id: true,
      title: true,
      permalink: true,
      content: true,
      metaDescription: true,
      status: true,
    },
  });

  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Ulasan</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <UlasanForm
          initial={{
            id: String(post.id),
            title: post.title,
            permalink: post.permalink,
            content: post.content,
            metaDescription: post.metaDescription ?? "",
            status: post.status as "DRAFT" | "PUBLISHED",
          }}
        />
      </div>
    </div>
  );
}
