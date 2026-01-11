import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RefereeAI — Think Clearly',
  description: 'A calm decision companion. Compare options, understand trade-offs, and choose with confidence. We never decide for you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
