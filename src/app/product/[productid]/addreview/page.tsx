import AddReviewForm from "@/components/addreviewform";
import prisma from "@/lib/prisma";

type Props = {
  params: Promise<{ productid: string }>; // Next.js params are always strings
};

export default async function Page({ params }: Props) {
  const { productid } = await params;
  const id = Number(productid);

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Product not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddReviewForm productId={id} name={product.name} />
      </div>
    </main>
  );
}
