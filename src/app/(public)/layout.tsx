export const runtime = "nodejs";
import { Metadata } from 'next';
import Nav from '../../components/nav';
import Image from 'next/image';
import "./../globals.css"

export const metadata: Metadata = {
    title: {
        default: 'Cek.id',
        template: '%s | Cek.id',
    },
    description: 'Barang beneran, review beneran',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="id">
            <body>
                <header 
                style=
                {{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 2rem',
                    borderBottom: '1px solid #eaeaea',
                    }}
                >
                    <div style={{ margin: 0 }}>
                        <Image 
                            src="/logo.png" 
                            alt="Cek.id Logo" 
                            width={120} 
                            height={40} 
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    
                    <Nav />  
                </header>
                {children}
                <footer
                    style={{
                        textAlign: 'center',
                        padding: '1rem 0',
                        borderTop: '1px solid #eaeaea',
                        marginTop: '2rem',
                    }}
                >
                    <p>&copy; 2025 Cek.id. All rights reserved.</p>
                </footer>
                </body>
        </html>
    )
}