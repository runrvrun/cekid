export const metadata = {
    title: 'About',
};

export default function About() {
    return (
        <main className="flex flex-col items-center justify-between p-24">
            <h1 className="text-5xl font-bold mb-1">Beri Saran Untuk Kami</h1>
            <p className="text-lg text-center mb-8">
                Kami sangat menghargai masukan Anda untuk membantu kami meningkatkan layanan kami. 
                <br/>Silakan berikan saran, kritik, atau ide-ide yang Anda miliki.
            </p>
            <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfujzT0yTRn-4oZEd1ZZEPX0yzKcQK1kPW6BleoSpkcbuslWg/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                Beri Feedback
            </a>
        </main>
    );
}