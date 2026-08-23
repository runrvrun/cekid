export const runtime = "nodejs";

import { Metadata } from 'next';
import "./globals.css";
import Header from '../components/header';
import { GoogleAnalytics } from "@next/third-parties/google";
import { auth } from "@/lib/auth";
import { getReviewPromptData } from "@/lib/prisma/products";
import ReviewPromptPopup from "@/components/reviewpromptpopup";

export const metadata: Metadata = {
    title: {
        default: 'beliga.id - Cek review sebelum beli',
        template: '%s - beliga.id',
    },
    description: 'Mau beli snack atau minuman di minimarket tapi ragu enak apa nggak? Cek dulu reviewnya di sini.',
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const reviewPromptProduct = session?.user?.id
        ? await getReviewPromptData(session.user.id)
        : null;

    return (
        <html lang="id">
            <GoogleAnalytics gaId='G-TQBCKVMPSV' />
            <body className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-1 w-full">
                {children}
                </main>

                <ReviewPromptPopup key={reviewPromptProduct?.slug ?? "none"} product={reviewPromptProduct} />

                <footer
                    style={{
                        textAlign: 'center',
                        padding: '1rem 0',
                        borderTop: '1px solid #eaeaea',
                        marginTop: '2rem',
                        fontSize: '0.875rem',
                        color: '#666',
                    }}
                >
                    <p>&copy; {new Date().getFullYear()} beliga.id. All rights reserved.</p>
                </footer>
            </body>
        </html>
    );
}