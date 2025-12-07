"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-5xl font-bold">Something went wrong!</h1>
            <p className="mt-4 text-red-500">{error.message}</p>
        </main>
    );
}