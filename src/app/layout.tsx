export const runtime = "nodejs";

import { Metadata } from 'next';
import "./globals.css";
import Header from '../components/header';

export const metadata: Metadata = {
    title: {
        default: 'enakga',
        template: '%s | enakga',
    },
    description: 'Barang beneran, review beneran',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <body className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-1 flex items-center justify-center">
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