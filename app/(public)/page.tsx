import { calcularLoteAtual, TABELA_LOTES } from '@/lib/lote';
import { formatBRL } from '@/lib/utils';
import { InscricaoForm } from '@/components/landing/InscricaoForm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Music, UtensilsCrossed, Beer, Clock, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PARTICIPANTES = [
  { nome: 'André Adalba', papel: 'Convidado especial' },
  { nome: 'Netão Santa Fé', papel: 'Anfitrião' },
  { nome: 'Júnior Petiscos Burguer', papel: 'Convidado especial' },
  { nome: 'Rafa Soares Santa Fé', papel: 'Convidado especial' },
  { nome: 'Silvinho', papel: 'Convidado especial' },
];

const CARDAPIO = [
  'Burguer Johns',
  'Taco de Costela e Brócolis com Coalhada',
  'Maminha na Josper',
  'Milho Grelhado',
  'Arroz Caldoso',
  'Cupim Santa Fé',
  '+ um prato secreto',
];

export default async function HomePage() {
  const lote = await calcularLoteAtual();

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-santafe-navy text-santafe-cream">
        <div className="absolute inset-0 grain opacity-50" />
        <div className="absolute inset-x-0 top-0 h-3 stripes-orange" />

        <div className="container relative px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="default" className="mb-6 px-4 py-2 text-sm">
              · Encontro Nacional de Donos de Restaurantes ·
            </Badge>

            <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Segunda <br />
              <span className="text-santafe-orange">Sem Folga</span>
              <br />
              <span className="text-stroke text-santafe-cream">Santa Fé</span>{' '}
              <span className="text-santafe-orange">Experience</span>
            </h1>

            <div className="mt-8 flex flex-col items-center gap-2 text-lg font-bold uppercase tracking-wide sm:flex-row sm:justify-center sm:gap-6">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-santafe-orange" />
                27 de abril · 20h às 23h59
              </span>
              <span className="hidden text-santafe-orange sm:inline">·</span>
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-santafe-orange" />
                Vila Leopoldina, SP
              </span>
            </div>

            <div className="mt-10 inline-block">
              {!lote.esgotado ? (
                <div className="rounded-md border-2 border-santafe-orange bg-santafe-orange/10 px-6 py-3 backdrop-blur">
                  <p className="text-sm uppercase tracking-wider text-santafe-orange">
                    Lote {lote.lote} · agora
                  </p>
                  <p className="mt-1 font-display text-4xl text-santafe-cream">
                    {formatBRL(lote.valorCentavos)}
                  </p>
                  <p className="mt-1 text-xs text-santafe-cream/80">
                    Restam <span className="font-bold text-santafe-orange">{lote.restantes}</span> vagas neste valor
                  </p>
                </div>
              ) : (
                <Badge variant="destructive" className="px-6 py-3 text-base">
                  ESGOTADO
                </Badge>
              )}
            </div>

            <div className="mt-8">
              <a
                href="#inscricao"
                className="inline-flex h-14 items-center justify-center rounded-md bg-santafe-orange px-10 text-lg font-bold uppercase tracking-wide text-santafe-black shadow-[0_4px_0_0_#C76F1A] transition-all hover:translate-y-[2px] hover:bg-santafe-orange-bright hover:shadow-[0_2px_0_0_#C76F1A] active:scale-[0.98]"
              >
                Garantir meu ingresso
              </a>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-3 stripes-orange" />
      </section>

      {/* O QUE TEM NO ROLÊ */}
      <section className="container px-4 py-16 md:py-20">
        <h2 className="text-center font-display text-4xl uppercase text-santafe-navy md:text-5xl">
          O que tem no rolê
        </h2>
        <div className="mx-auto mt-2 h-1 w-24 bg-santafe-orange" />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card className="text-center">
            <CardContent className="p-6">
              <Music className="mx-auto h-10 w-10 text-santafe-orange" />
              <h3 className="mt-3 font-display text-xl uppercase">Música ao vivo</h3>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <UtensilsCrossed className="mx-auto h-10 w-10 text-santafe-orange" />
              <h3 className="mt-3 font-display text-xl uppercase">Open food</h3>
              <p className="mt-1 text-sm text-santafe-navy/70">Cardápio diferenciado</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Beer className="mx-auto h-10 w-10 text-santafe-orange" />
              <h3 className="mt-3 font-display text-xl uppercase">Bebida liberada</h3>
              <p className="mt-1 text-sm text-santafe-navy/70">Chopp, água e refri</p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-md border-2 border-santafe-navy bg-santafe-cream p-6 shadow-[6px_6px_0_0_#1B2B3F]">
          <h3 className="font-display text-2xl uppercase text-santafe-navy">Cardápio</h3>
          <ul className="mt-3 grid gap-2 text-santafe-navy md:grid-cols-2">
            {CARDAPIO.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-santafe-orange" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* QUEM VAI ESTAR LÁ */}
      <section className="bg-santafe-navy py-16 text-santafe-cream md:py-20">
        <div className="container px-4">
          <h2 className="text-center font-display text-4xl uppercase md:text-5xl">
            Quem vai estar lá
          </h2>
          <div className="mx-auto mt-2 h-1 w-24 bg-santafe-orange" />

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {PARTICIPANTES.map((p) => (
              <div
                key={p.nome}
                className="rounded-md border-2 border-santafe-orange bg-santafe-navy-deep p-5 text-center transition-transform hover:-translate-y-1"
              >
                <Users className="mx-auto h-10 w-10 text-santafe-orange" />
                <p className="mt-3 font-display text-lg uppercase leading-tight">{p.nome}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-santafe-cream/70">{p.papel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOTES */}
      <section className="container px-4 py-16 md:py-20">
        <h2 className="text-center font-display text-4xl uppercase text-santafe-navy md:text-5xl">
          Lotes
        </h2>
        <div className="mx-auto mt-2 h-1 w-24 bg-santafe-orange" />

        <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-md border-2 border-santafe-navy">
          {TABELA_LOTES.map((t, idx) => {
            const inicio = idx === 0 ? 1 : TABELA_LOTES[idx - 1].ate + 1;
            const fim = t.ate;
            const isAtual = !lote.esgotado && lote.lote === t.lote;
            const isPassado = lote.esgotado || (!lote.esgotado && lote.lote > t.lote);
            return (
              <div
                key={t.lote}
                className={`flex items-center justify-between border-b-2 border-santafe-navy px-5 py-4 last:border-b-0 ${
                  isAtual ? 'bg-santafe-orange text-santafe-black' : 'bg-santafe-cream'
                } ${isPassado ? 'opacity-50' : ''}`}
              >
                <div>
                  <p className="font-display text-xl uppercase">Lote {t.lote}</p>
                  <p className={`text-xs ${isAtual ? 'text-santafe-black/80' : 'text-santafe-navy/70'}`}>
                    Do {inicio}º ao {fim}º pagante
                  </p>
                </div>
                <div className={`font-display text-2xl ${isPassado ? 'line-through' : ''}`}>
                  {formatBRL(t.valorCentavos)}
                </div>
                {isAtual && <Badge variant="navy">Atual</Badge>}
              </div>
            );
          })}
        </div>
      </section>

      {/* LOCAL */}
      <section className="bg-santafe-cream py-16 md:py-20">
        <div className="container px-4">
          <h2 className="text-center font-display text-4xl uppercase text-santafe-navy md:text-5xl">
            Onde rola
          </h2>
          <div className="mx-auto mt-2 h-1 w-24 bg-santafe-orange" />

          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-md border-2 border-santafe-navy shadow-[6px_6px_0_0_#1B2B3F]">
            <iframe
              src="https://www.google.com/maps?q=Rua%20Carlos%20Weber%2064%20Vila%20Leopoldina%20S%C3%A3o%20Paulo&output=embed"
              width="100%"
              height="320"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa Santa Fé"
            />
            <div className="bg-santafe-navy p-5 text-santafe-cream">
              <p className="flex items-center gap-2 font-display text-xl uppercase">
                <MapPin className="h-5 w-5 text-santafe-orange" />
                Rua Carlos Weber, 64
              </p>
              <p className="mt-1 text-sm">Vila Leopoldina · São Paulo · SP</p>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section id="inscricao" className="bg-santafe-navy py-16 text-santafe-cream md:py-20">
        <div className="container px-4">
          <h2 className="text-center font-display text-4xl uppercase md:text-5xl">
            Garante sua vaga
          </h2>
          <div className="mx-auto mt-2 h-1 w-24 bg-santafe-orange" />
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-santafe-cream/80">
            Pagamento via PIX · confirmação por WhatsApp com número da comanda
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-lg border-2 border-santafe-orange bg-santafe-cream p-6 text-santafe-navy shadow-[6px_6px_0_0_#F39C3C]">
            <InscricaoForm loteInicial={lote} />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-santafe-navy-deep py-10 text-santafe-cream">
        <div className="container px-4 text-center">
          <p className="font-display text-2xl uppercase tracking-wider text-santafe-orange">
            Santa Fé Experience
          </p>
          <p className="mt-2 text-sm">Rua Carlos Weber, 64 · Vila Leopoldina · São Paulo</p>
          <p className="mt-4 text-sm">
            Dúvidas:{' '}
            <a
              href="https://wa.me/5521983706066"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-santafe-orange hover:underline"
            >
              WhatsApp 21 98370-6066
            </a>
          </p>
          <p className="mt-6 text-xs text-santafe-cream/50">
            © {new Date().getFullYear()} Santa Fé · Segunda Sem Folga
          </p>
        </div>
      </footer>
    </main>
  );
}
