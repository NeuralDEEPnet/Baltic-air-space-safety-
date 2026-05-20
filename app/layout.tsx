import type {Metadata} from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Baltic Overwatch | Security Radar',
  description: 'Real-time multi-layer threat visualization and alerts for the Baltic region airspace.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`}>
      <body className="font-mono bg-neutral-950 text-neutral-100" suppressHydrationWarning>{children}</body>
    </html>
  );
}
