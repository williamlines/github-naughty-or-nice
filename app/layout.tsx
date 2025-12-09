import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SnowfallEffect } from '@/components/SnowfallEffect';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Naughty or Nice - GitHub Edition',
  description:
    'Find out if your GitHub activity lands you on the nice list or the naughty list this year!',
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🎅</text></svg>",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white antialiased`}>
        <SnowfallEffect />
        {children}
      </body>
    </html>
  );
}
