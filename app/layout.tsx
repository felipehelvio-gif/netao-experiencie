import type { Metadata, Viewport } from 'next';
import { Anton, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

const display = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Santa Fé Experience — Segunda Sem Folga',
  description:
    'Encontro Nacional de Donos de Restaurantes. 27 de abril, 20h. Open food, chopp liberado, música ao vivo. Vila Leopoldina, SP.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://netao.kairulabs.com.br'),
  openGraph: {
    title: 'Santa Fé Experience — Segunda Sem Folga',
    description:
      'Encontro Nacional de Donos de Restaurantes — 27 de abril, 20h, Vila Leopoldina',
    type: 'website',
    locale: 'pt_BR',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#F39C3C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
