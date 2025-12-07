import Link from "next/link";

export default function ProductList() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-5xl font-bold">Products</h1>
            <h2><Link href="/product/1">Product 1</Link></h2>
            <h2>Product 2</h2>
            <h2>Product 3</h2>
        </main>
    );
}