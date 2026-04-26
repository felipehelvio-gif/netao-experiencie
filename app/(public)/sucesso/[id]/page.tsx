import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { padComanda } from '@/lib/utils';
import { Calendar, Clock, MapPin, CheckCircle2, MessageCircle } from 'lucide-react';

const ROCK_HAND = String.fromCodePoint(0x1f918); // 🤘 — runtime pra evitar double-escape do SWC

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SucessoPage({ params }: { params: { id: string } }) {
  const insc = await prisma.inscricao.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      nome: true,
      status: true,
      numeroComanda: true,
      paidAt: true,
    },
  });

  if (!insc) notFound();

  if (insc.status !== 'PAGA' || insc.numeroComanda == null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-santafe-navy p-6 text-santafe-cream">
        <div className="max-w-md rounded-lg border-2 border-santafe-orange bg-santafe-navy-deep p-8 text-center">
          <h1 className="font-display text-3xl uppercase">Pagamento ainda não confirmado</h1>
          <p className="mt-2 text-sm">
            Se você acabou de pagar, aguarda alguns segundos. A confirmação chega no seu WhatsApp.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-santafe-orange px-6 py-3 font-bold uppercase text-santafe-black"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const comanda = padComanda(insc.numeroComanda);
  const primeiroNome = insc.nome.trim().split(/\s+/)[0];

  return (
    <main className="flex min-h-screen flex-col bg-santafe-navy text-santafe-cream">
      <div className="h-3 flex-shrink-0 stripes-orange" />

      <div className="container flex-1 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-xl">
          {/* Confirmação */}
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400 animate-fade-in" />
            <p className="mt-3 font-bold uppercase tracking-widest text-santafe-orange">
              Pagamento confirmado
            </p>
            <h1 className="mt-2 font-display text-3xl uppercase md:text-4xl">
              Bora, {primeiroNome}! {ROCK_HAND}
            </h1>
          </div>

          {/* Comanda em destaque GIGANTE */}
          <div className="mt-10 overflow-hidden rounded-lg border-4 border-santafe-orange bg-santafe-cream text-santafe-navy shadow-[8px_8px_0_0_#F39C3C]">
            <div className="bg-santafe-orange py-3 text-center text-santafe-black">
              <p className="font-bold uppercase tracking-widest">Sua comanda</p>
            </div>
            <div className="px-6 py-10 text-center">
              <p
                className="font-display text-[26vw] leading-none tracking-tight md:text-[180px]"
                style={{ letterSpacing: '-0.05em' }}
              >
                #{comanda}
              </p>
              <p className="mt-4 font-display text-2xl uppercase">{insc.nome}</p>
            </div>
            <div className="bg-santafe-navy py-3 text-center text-santafe-cream">
              <p className="text-sm font-bold uppercase tracking-wider">
                Mostre essa tela na entrada
              </p>
            </div>
          </div>

          {/* Detalhes do evento */}
          <div className="mt-8 grid gap-3 rounded-md border-2 border-santafe-orange/40 bg-santafe-navy-deep p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 flex-shrink-0 text-santafe-orange" />
              <span className="font-bold">27 de abril · segunda-feira</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 flex-shrink-0 text-santafe-orange" />
              <span className="font-bold">20h às 23h59</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 flex-shrink-0 text-santafe-orange" />
              <span>
                <span className="font-bold">Rua Carlos Weber, 64</span>
                <br />
                <span className="text-santafe-cream/80">Vila Leopoldina · São Paulo</span>
              </span>
            </div>
          </div>

          {/* WhatsApp aviso */}
          <div className="mt-6 flex items-start gap-3 rounded-md bg-santafe-orange/10 p-4 text-sm text-santafe-cream">
            <MessageCircle className="h-5 w-5 flex-shrink-0 text-santafe-orange" />
            <p>Você também recebeu essa confirmação no WhatsApp.</p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block text-sm uppercase tracking-wider text-santafe-cream/60 hover:text-santafe-orange"
            >
              ← Voltar pra página inicial
            </Link>
          </div>
        </div>
      </div>

      <div className="h-3 flex-shrink-0 stripes-orange" />
    </main>
  );
}
