import AddReviewForm from "@/components/addreviewform";

type Props = { params: { productid: string } };

export default function Page({ params }: Props) {
  const productId = Number(params.productid);

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddReviewForm productId={productId} />
      </div>
    </main>
  );
}