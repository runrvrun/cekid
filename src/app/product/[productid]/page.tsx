import { Metadata } from 'next';
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import AddReviewForm from '@/components/addreviewform';

type Props = {
    params: Promise<{ productid: number }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const id = (await params).productid;

    if (Number.isNaN(id)) {
        return { title: "Review Produk" };
    }

    const product = await prisma.product.findUnique({
        where: { id },
        select: { name: true },
    });

    return {
        title: product ? `Review ${product.name}` : "Produk tidak ditemukan",
    };
};

export default async function ProductDetail({ params }: Props) {
    const id = (await params).productid;
    const reviewer = (await auth())?.user?.id;

    if (Number.isNaN(id)) {
        return (
            <main className="max-w-3xl mx-auto p-6">
                <div className="text-center text-red-600">ID produk tidak valid.</div>
            </main>
        );
    }

    const product = await prisma.product.findUnique({
        where: { id },
    });

    if (!product) {
        return (
            <main className="max-w-3xl mx-auto p-6">
                <div className="text-center text-gray-600">Produk tidak ditemukan.</div>
                <div className="mt-4 text-center">
                    <Link href="/" className="text-blue-600 hover:underline">
                        Kembali ke beranda
                    </Link>
                </div>
            </main>
        );
    }

    const reviews = await prisma.review.findMany({
        where: { productId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            user: {
                select: { name: true }
            }
        }
    });

    var userreviewed = null;

    const userreview = await prisma.review.findFirst({
        where: { productId: id, userId: reviewer }, // TODO: replace null with current user ID when auth is implemented
    });

    if (userreview?.id) {
        userreviewed = true;
    }

    return (
        <main className="max-w-3xl mx-auto p-6">
            {/* Product detail */}
            <section className="mb-8 bg-base-100 rounded-lg shadow p-6 flex flex-col items-center">
                <Image
                    src={product.image ?? "/product-placeholder.png"}
                    alt={product.name ?? "Produk"}
                    className="w-full h-96 object-cover rounded"
                    width={800}
                    height={800}
                />
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                <div className="text-lg font-semibold text-blue-600 mb-2">
                    {(product.rating ?? 0).toFixed(1)}
                </div>
                {product.description && (
                    <p className="text-gray-700 mb-2">{product.description}</p>
                )}
                {product.upc && (
                    <div className="text-sm text-gray-500 mb-2">UPC: {product.upc}</div>
                )}
            </section>

            {/* Add review button if user haven't reviewed */}
            {!userreviewed && (
                <div className="flex justify-end mb-4">
                    <Link href={`/product/${id}/addreview`}>
                        <Button className="btn btn-primary">
                            Beri Review
                        </Button>
                    </Link>
                </div>
            )}

        <AddReviewForm productId={id} name={product.name} />

            {/* Reviews */}
            <section>
                <h2 className="text-xl font-bold mb-4">Reviews</h2>
                <div className="flex flex-col gap-4">
                    {reviews.length === 0 && (
                        <div className="text-gray-600">Belum ada review untuk produk ini.</div>
                    )}

                    {reviews.map((r) => (
                        <div key={r.id} className="card bg-base-100 shadow w-full">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold">
                                        {r.anonymous ? "Pengguna" : (r.user?.name ?? "Pengguna")}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                                    </span>
                                </div>
                                <div className="mb-2 text-yellow-600 font-medium">{r.rating}</div>
                                {r.review && <p className="mb-4">{r.review}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
