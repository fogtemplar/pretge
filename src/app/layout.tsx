import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pre-TGE Oracle',
  description: 'Track pre-TGE crypto project valuations from Polymarket',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
