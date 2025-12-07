import "@/app/globals.css"

export default function SignInLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <body>
                <main className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    {children}
                    </div>
                </main>
            </body>
        </html>
    );
}