import AddReviewForm from "@/components/addreviewform";

type Props = {
    params: Promise<{ productid: number }>;
};

export default async function Page({ params }: Props) {
  const productid = (await params).productid;

  return (
    <main className="min-h-screen bg-base-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        <AddReviewForm productId={productid} />
      </div>
    </main>
  );
}