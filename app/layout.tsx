import type { Metadata, Viewport } from 'next';
import { Anton, Inter, Alfa_Slab_One, Fraunces } from 'next/font/google';
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

const slab = Alfa_Slab_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-slab',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  axes: ['SOFT', 'WONK'],
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
  themeColor: '#1B2B3F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${slab.variable} ${serif.variable}`}
    >
      <body className="min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
