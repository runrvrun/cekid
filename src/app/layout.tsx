export const runtime = "nodejs";

import { Metadata } from 'next';
import "./globals.css";
import Header from '../components/header';
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
    title: {
        default: 'Enak Ga? Cek review sebelum beli',
        template: '%s - Enak Ga?',
    },
    description: 'Mau beli snack atau minuman di minimarket tapi ragu enak apa nggak? Cek dulu reviewnya di sini.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <GoogleAnalytics gaId='G-TQBCKVMPSV' />
            <body className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-1 w-full">
                {children}
                </main>

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
                    <p>&copy; {new Date().getFullYear()} enakga. All rights reserved.</p>
                </footer>
            </body>
        </html>
    );
}