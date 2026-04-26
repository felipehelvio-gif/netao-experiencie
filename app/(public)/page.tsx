import Image from 'next/image';
import { calcularLoteAtual, TABELA_LOTES } from '@/lib/lote';
import { formatBRL } from '@/lib/utils';
import { InscricaoForm } from '@/components/landing/InscricaoForm';
import {
  MapPin,
  Music,
  UtensilsCrossed,
  Beer,
  Clock,
  Flame,
  ArrowDown,
  Calendar,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PARTICIPANTES = [
  { num: '01', nome: 'André Adalba', papel: 'Convidado especial' },
  { num: '02', nome: 'Netão Santa Fé', papel: 'Anfitrião' },
  { num: '03', nome: 'Junior Peto Burger', papel: 'Convidado especial' },
  { num: '04', nome: 'Rafa Soares Santa Fé', papel: 'Convidado especial' },
  { num: '05', nome: 'Silvinho', papel: 'Convidado especial' },
  { num: '06', nome: 'Badaró', papel: 'Cozinheiro' },
];

const CARDAPIO = [
  'Burguer Johns',
  'Taco de Costela e Brócolis com Coalhada',
  'Maminha na Josper',
  'Milho Grelhado',
  'Arroz Caldoso',
  'Cupim Santa Fé',
  'Língua no Vinho Malbec',
  '+ um prato secreto',
];

// Marquee items (loopam infinito)
const MARQUEE_TOP = [
  '27 · ABRIL · 2026',
  'Vila Leopoldina · SP',
  'Open Food',
  'Chopp Liberado',
  'Música Ao Vivo',
  'Encontro Nacional',
  'Donos de Restaurante',
];

export default async function HomePage() {
  const lote = await calcularLoteAtual();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-santafe-cream text-santafe-navy">
      {/* MARQUEE TOPO — preto, contínuo */}
      <div className="overflow-hidden border-b-2 border-santafe-orange bg-santafe-black py-2 text-santafe-cream">
        <div className="marquee-mask flex whitespace-nowrap">
          <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8">
            {[...MARQUEE_TOP, ...MARQUEE_TOP].map((t, i) => (
              <span
                key={i}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em]"
              >
                <Flame className="h-3 w-3 text-santafe-orange" />
                {t}
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="flex shrink-0 animate-marquee items-center gap-8 pr-8"
          >
            {[...MARQUEE_TOP, ...MARQUEE_TOP].map((t, i) => (
              <span
                key={`dup-${i}`}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em]"
              >
                <Flame className="h-3 w-3 text-santafe-orange" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-santafe-navy text-santafe-cream">
        {/* Halftone overlay */}
        <div className="absolute inset-0 halftone-orange opacity-40" />
        {/* Ember radial */}
        <div className="absolute -bottom-32 left-1/2 h-96 w-[120%] -translate-x-1/2 ember-glow blur-2xl" />

        <div className="container relative px-4 py-12 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            {/* COLUNA ESQUERDA — texto */}
            <div className="relative order-2 lg:order-1">
              {/* Tagline editorial italic */}
              <p className="mb-6 flex items-center gap-3 font-serif text-base italic text-santafe-orange/90 md:text-lg">
                <span className="h-px w-10 bg-santafe-orange/60" />
                Encontro Nacional · Donos de Restaurante
              </p>

              {/* Título massivo */}
              <h1 className="font-display leading-[0.82] tracking-tight">
                <span className="block text-[18vw] uppercase text-santafe-cream sm:text-[14vw] lg:text-[7.5rem] xl:text-[9rem]">
                  Segunda
                </span>
                <span className="block text-[18vw] uppercase text-santafe-orange sm:text-[14vw] lg:text-[7.5rem] xl:text-[9rem]">
                  Sem Folga
                </span>
                <span className="mt-2 block font-serif text-base italic text-santafe-cream/70 md:text-xl">
                  edição
                </span>
                <span className="-mt-1 block text-stroke-cream text-[14vw] uppercase sm:text-[10vw] lg:text-[6rem] xl:text-[7rem]">
                  Santa Fé Experience
                </span>
              </h1>

              {/* Faixa info: data + local com tape effects */}
              <div className="relative mt-10 inline-flex flex-wrap items-center gap-4 rounded-md border-2 border-santafe-orange bg-santafe-navy-deep/70 px-5 py-3 backdrop-blur-sm">
                <span className="tape -top-3 left-3 -rotate-6" />
                <span className="flex items-center gap-2 font-bold uppercase tracking-wide">
                  <Calendar className="h-5 w-5 text-santafe-orange" />
                  27 · 04 · 26
                </span>
                <span className="text-santafe-orange/60">/</span>
                <span className="flex items-center gap-2 font-bold uppercase tracking-wide">
                  <Clock className="h-5 w-5 text-santafe-orange" />
                  20h às 23h59
                </span>
                <span className="text-santafe-orange/60">/</span>
                <span className="flex items-center gap-2 font-bold uppercase tracking-wide">
                  <MapPin className="h-5 w-5 text-santafe-orange" />
                  Vila Leopoldina · SP
                </span>
              </div>

              {/* Lote scoreboard ao vivo */}
              <div className="mt-8 flex flex-wrap items-end gap-5">
                {!lote.esgotado ? (
                  <div className="relative w-fit rounded-lg border-4 border-santafe-orange bg-santafe-cream p-5 text-santafe-navy shadow-hard-orange">
                    <span className="absolute -top-3 left-4 flex items-center gap-2 rounded-full bg-santafe-ember px-3 py-1 text-xs font-bold uppercase tracking-widest text-santafe-cream">
                      <span className="live-dot" />
                      Ao vivo
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-santafe-navy/70">
                      Lote {lote.lote} · agora
                    </p>
                    <p className="mt-1 font-slab text-5xl leading-none text-santafe-navy">
                      {formatBRL(lote.valorCentavos)}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-santafe-orange-deep">
                      Restam {lote.restantes} vagas neste valor
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border-4 border-santafe-ember bg-santafe-cream px-6 py-5 text-santafe-ember shadow-hard">
                    <p className="font-display text-4xl uppercase">Esgotado</p>
                    <p className="mt-1 text-xs uppercase tracking-widest">
                      Entra na lista de espera abaixo
                    </p>
                  </div>
                )}

                <a
                  href="#inscricao"
                  className="group relative inline-flex h-16 items-center justify-center gap-3 rounded-md bg-santafe-orange px-8 font-display text-2xl uppercase tracking-wide text-santafe-black shadow-[0_6px_0_0_#8C4D11] transition-all hover:translate-y-[3px] hover:bg-santafe-orange-bright hover:shadow-[0_3px_0_0_#8C4D11] active:translate-y-[6px] active:shadow-[0_0_0_0_#8C4D11]"
                >
                  Garantir ingresso
                  <ArrowDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
                </a>
              </div>
            </div>

            {/* COLUNA DIREITA — Flyer */}
            <div className="relative order-1 mx-auto w-full max-w-md lg:order-2">
              <div className="relative">
                {/* Tape pieces */}
                <span className="tape -left-4 top-2 rotate-[-12deg]" />
                <span className="tape -right-4 top-2 rotate-[12deg]" />
                <span className="tape bottom-3 -left-4 rotate-[8deg]" />
                <span className="tape bottom-3 -right-4 rotate-[-8deg]" />

                {/* Stamp "cartaz oficial" */}
                <div className="absolute -left-3 top-10 z-20 rotate-[-12deg] bg-santafe-ember px-3 py-1 font-display text-xs uppercase tracking-widest text-santafe-cream shadow-md sm:-left-6">
                  ★ Cartaz oficial ★
                </div>

                <div className="relative aspect-[675/1200] overflow-hidden rounded-md border-4 border-santafe-cream bg-santafe-cream shadow-[16px_16px_0_0_#F39C3C]">
                  <Image
                    src="/flyer-evento.jpg"
                    alt="Cartaz · Segunda Sem Folga · Santa Fé Experience"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 45vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MARQUEE Bottom hero — laranja */}
        <div className="overflow-hidden border-y-2 border-santafe-navy bg-santafe-orange py-3 text-santafe-black">
          <div className="marquee-mask flex whitespace-nowrap">
            <div className="flex shrink-0 animate-marquee-slow items-center gap-12 pr-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="flex items-center gap-4 font-display text-2xl uppercase tracking-wider"
                >
                  Segunda Sem Folga
                  <Flame className="h-6 w-6" />
                  Santa Fé Experience
                  <Flame className="h-6 w-6" />
                </span>
              ))}
            </div>
            <div
              aria-hidden
              className="flex shrink-0 animate-marquee-slow items-center gap-12 pr-12"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={`dup-${i}`}
                  className="flex items-center gap-4 font-display text-2xl uppercase tracking-wider"
                >
                  Segunda Sem Folga
                  <Flame className="h-6 w-6" />
                  Santa Fé Experience
                  <Flame className="h-6 w-6" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 01 — O QUE TEM NO ROLÊ */}
      <section className="paper relative overflow-hidden">
        <div className="container px-4 py-20 md:py-28">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="section-index">/ 01</p>
              <h2 className="mt-2 font-display text-5xl uppercase leading-none text-santafe-navy md:text-7xl">
                O que tem
                <br />
                <span className="text-santafe-orange">no rolê</span>
              </h2>
            </div>
            <p className="hidden max-w-xs text-right font-serif italic text-santafe-navy/70 md:block">
              "Mesa farta, papo bom e gente que faz comida acontecer."
            </p>
          </div>

          {/* 3 features asymmetric */}
          <div className="grid gap-5 md:grid-cols-12">
            <div className="md:col-span-5 md:row-span-2">
              <div className="group relative h-full rounded-lg border-2 border-santafe-navy bg-santafe-orange p-8 shadow-hard transition-transform hover:-translate-y-1 hover:rotate-[-0.5deg]">
                <UtensilsCrossed className="h-12 w-12 text-santafe-navy" strokeWidth={2.5} />
                <h3 className="mt-6 font-display text-4xl uppercase leading-tight text-santafe-navy md:text-5xl">
                  Open food
                  <br />
                  <span className="font-serif text-2xl italic">cardápio</span>{' '}
                  diferenciado
                </h3>
                <p className="mt-4 max-w-sm text-sm text-santafe-navy/80">
                  Sete pratos do menu Santa Fé + um secreto. Vai e vem da cozinha
                  a noite toda.
                </p>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="group flex h-full items-center gap-5 rounded-lg border-2 border-santafe-navy bg-santafe-cream-warm p-6 shadow-hard transition-transform hover:-translate-y-1">
                <Beer className="h-12 w-12 flex-shrink-0 text-santafe-orange-dark" strokeWidth={2.5} />
                <div>
                  <h3 className="font-display text-3xl uppercase text-santafe-navy md:text-4xl">
                    Chopp · Água · Refri
                  </h3>
                  <p className="mt-1 font-serif italic text-santafe-navy/70">
                    bebida liberada a noite toda
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="group flex h-full items-center gap-5 rounded-lg border-2 border-santafe-navy bg-santafe-navy p-6 text-santafe-cream shadow-hard-orange transition-transform hover:-translate-y-1">
                <Music className="h-12 w-12 flex-shrink-0 text-santafe-orange" strokeWidth={2.5} />
                <div>
                  <h3 className="font-display text-3xl uppercase md:text-4xl">
                    Música ao vivo
                  </h3>
                  <p className="mt-1 font-serif italic text-santafe-cream/70">
                    trilha pra noite inteira
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARDÁPIO — bloco split: imagem oficial + lista numerada */}
          <div className="mt-20 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-stretch">
            <div className="relative">
              <span className="tape -left-3 top-3 rotate-[-8deg]" />
              <div className="relative aspect-[675/1200] overflow-hidden rounded-md border-4 border-santafe-navy shadow-hard-lg">
                <Image
                  src="/cardapio.jpg"
                  alt="Cardápio Santa Fé Experience"
                  fill
                  sizes="(max-width: 768px) 80vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="relative flex flex-col justify-center">
              <p className="mb-2 font-serif text-base italic text-santafe-navy/70">
                — o cardápio da noite —
              </p>
              <h3 className="font-display text-5xl uppercase leading-none text-santafe-navy md:text-6xl">
                Mesa farta
              </h3>
              <ol className="mt-8 grid gap-3">
                {CARDAPIO.map((item, i) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-4 border-b border-dashed border-santafe-navy/30 pb-3 text-lg"
                  >
                    <span className="font-slab text-santafe-orange">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium text-santafe-navy">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 02 — QUEM VAI ESTAR LÁ */}
      <section className="relative overflow-hidden bg-santafe-navy py-20 text-santafe-cream md:py-28">
        <div className="absolute inset-0 halftone-orange opacity-15" />
        <div className="container relative px-4">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p
                className="section-index"
                style={{ WebkitTextStroke: '2px #FFF8EE' }}
              >
                / 02
              </p>
              <h2 className="mt-2 font-display text-5xl uppercase leading-none md:text-7xl">
                Quem vai
                <br />
                <span className="text-santafe-orange">estar lá</span>
              </h2>
            </div>
            <p className="hidden max-w-xs text-right font-serif italic text-santafe-cream/70 md:block">
              "Gente que faz a roda girar. Os caras que põem a mão na massa."
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {PARTICIPANTES.map((p, i) => (
              <div
                key={p.nome}
                className="group relative rounded-md border-2 border-santafe-orange bg-santafe-navy-deep p-5 transition-all hover:-translate-y-1 hover:bg-santafe-navy-soft"
                style={{ transform: `rotate(${i % 2 === 0 ? '-1deg' : '1deg'})` }}
              >
                <span className="absolute -top-3 left-3 bg-santafe-orange px-2 py-0.5 font-slab text-xs text-santafe-navy">
                  #{p.num}
                </span>
                <p className="mt-2 font-display text-xl uppercase leading-tight">
                  {p.nome}
                </p>
                <p className="mt-2 font-serif text-xs italic text-santafe-cream/70">
                  {p.papel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 03 — LOTES (ticket aesthetic) */}
      <section className="paper-warm relative overflow-hidden">
        <div className="container px-4 py-20 md:py-28">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="section-index">/ 03</p>
              <h2 className="mt-2 font-display text-5xl uppercase leading-none text-santafe-navy md:text-7xl">
                Lotes
              </h2>
            </div>
            <p className="hidden max-w-xs text-right font-serif italic text-santafe-navy/70 md:block">
              "Quem chegou primeiro paga menos. Sempre."
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {TABELA_LOTES.map((t, idx) => {
              const inicio = idx === 0 ? 1 : TABELA_LOTES[idx - 1].ate + 1;
              const fim = t.ate;
              const isAtual = !lote.esgotado && lote.lote === t.lote;
              const isPassado = lote.esgotado || (!lote.esgotado && lote.lote > t.lote);
              return (
                <div
                  key={t.lote}
                  className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border-2 border-santafe-navy px-5 py-5 transition-all ${
                    isAtual
                      ? 'scale-[1.02] bg-santafe-orange shadow-hard'
                      : isPassado
                      ? 'bg-santafe-cream/50 text-santafe-navy/40'
                      : 'bg-santafe-cream'
                  }`}
                >
                  {/* Stub esquerdo (numero do lote) */}
                  <div
                    className={`flex h-16 w-16 flex-col items-center justify-center rounded ${
                      isAtual
                        ? 'bg-santafe-navy text-santafe-orange'
                        : 'bg-santafe-navy text-santafe-cream'
                    } ${isPassado ? 'opacity-50' : ''}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Lote
                    </span>
                    <span className="font-slab text-3xl leading-none">
                      {t.lote}
                    </span>
                  </div>

                  {/* Linha central com perforation visual */}
                  <div className="relative">
                    <p
                      className={`font-display text-xl uppercase ${
                        isPassado ? 'line-through' : ''
                      }`}
                    >
                      Do {inicio}º ao {fim}º pagante
                    </p>
                    <p className="mt-0.5 font-serif text-xs italic text-santafe-navy/60">
                      {fim - inicio + 1} ingressos disponíveis
                    </p>
                    {isAtual && (
                      <span className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-santafe-navy">
                        <span className="live-dot" />
                        Vendendo agora
                      </span>
                    )}
                  </div>

                  {/* Preço */}
                  <div
                    className={`text-right ${isPassado ? 'opacity-50' : ''}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      por
                    </p>
                    <p
                      className={`font-slab text-3xl leading-none md:text-4xl ${
                        isPassado ? 'line-through' : ''
                      }`}
                    >
                      {formatBRL(t.valorCentavos)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 04 — LOCAL */}
      <section className="paper relative overflow-hidden">
        <div className="container px-4 py-20 md:py-28">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="section-index">/ 04</p>
              <h2 className="mt-2 font-display text-5xl uppercase leading-none text-santafe-navy md:text-7xl">
                Onde rola
              </h2>
            </div>
            <p className="hidden max-w-xs text-right font-serif italic text-santafe-navy/70 md:block">
              "Casa cheia, cozinha aberta, mesa pra todo mundo."
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="relative grid gap-0 overflow-hidden rounded-md border-2 border-santafe-navy shadow-hard-lg md:grid-cols-2">
              <div className="relative h-72 md:h-auto">
                <iframe
                  src="https://www.google.com/maps?q=Rua%20Carlos%20Weber%2064%20Vila%20Leopoldina%20S%C3%A3o%20Paulo&output=embed"
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa Santa Fé"
                />
              </div>
              <div className="relative bg-santafe-navy p-8 text-santafe-cream md:p-10">
                <span className="absolute right-6 top-6 stamp stamp-rotate-r text-santafe-orange">
                  Endereço
                </span>
                <p className="font-serif text-xs italic text-santafe-cream/60">
                  você está convidado pra
                </p>
                <p className="mt-3 font-display text-4xl uppercase leading-tight md:text-5xl">
                  Rua Carlos
                  <br />
                  Weber, 64
                </p>
                <p className="mt-2 font-serif text-lg italic text-santafe-orange">
                  Vila Leopoldina · São Paulo
                </p>
                <a
                  href="https://maps.google.com/?q=Rua+Carlos+Weber+64+Vila+Leopoldina+S%C3%A3o+Paulo"
                  target="_blank"
                  rel="noopener"
                  className="mt-6 inline-flex items-center gap-2 border-b-2 border-santafe-orange pb-1 text-sm font-bold uppercase tracking-widest text-santafe-orange transition-colors hover:text-santafe-cream"
                >
                  Abrir no Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 05 — FORM */}
      <section
        id="inscricao"
        className="relative overflow-hidden bg-santafe-navy py-20 text-santafe-cream md:py-28"
      >
        <div className="absolute inset-0 halftone-orange opacity-15" />
        <div className="container relative px-4">
          <div className="mx-auto max-w-xl text-center">
            <p
              className="section-index mx-auto"
              style={{ WebkitTextStroke: '2px #FFF8EE' }}
            >
              / 05
            </p>
            <h2 className="mt-2 font-display text-5xl uppercase leading-none md:text-7xl">
              Garante
              <br />
              <span className="text-santafe-orange">sua vaga</span>
            </h2>
            <p className="mt-4 font-serif text-lg italic text-santafe-cream/80">
              PIX em segundos · confirmação no WhatsApp com sua comanda
            </p>
          </div>

          {/* Form box — receipt aesthetic */}
          <div className="relative mx-auto mt-12 max-w-md">
            {/* Tape pieces */}
            <span className="tape -left-4 top-4 rotate-[-10deg]" />
            <span className="tape -right-4 top-4 rotate-[10deg]" />

            <div className="relative rounded-lg border-4 border-santafe-orange bg-santafe-cream p-6 text-santafe-navy shadow-[10px_10px_0_0_#F39C3C] md:p-8">
              {/* Receipt header */}
              <div className="mb-6 border-b-2 border-dashed border-santafe-navy/40 pb-4 text-center">
                <p className="font-slab text-xs uppercase tracking-[0.3em] text-santafe-navy/70">
                  · Pedido de ingresso ·
                </p>
                <p className="mt-1 font-serif text-base italic text-santafe-navy">
                  Santa Fé Experience · 27/04
                </p>
              </div>

              <InscricaoForm loteInicial={lote} />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="paper-warm border-t-2 border-santafe-navy">
        <div className="container px-4 py-14">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr_1fr] md:items-center">
            <div className="text-center md:text-left">
              <p className="font-serif text-sm italic text-santafe-navy/70">
                presented by
              </p>
              <div className="relative mx-auto mt-2 h-32 w-56 md:mx-0">
                <Image
                  src="/logo-santafe.jpg"
                  alt="Santa Fé · A Costela"
                  fill
                  sizes="224px"
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="font-display text-2xl uppercase text-santafe-navy">
                Local
              </p>
              <p className="mt-2 text-sm text-santafe-navy/80">
                Rua Carlos Weber, 64
                <br />
                Vila Leopoldina · São Paulo · SP
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="font-display text-2xl uppercase text-santafe-navy">
                Dúvidas
              </p>
              <a
                href="https://wa.me/5511911454499"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-slab text-lg text-santafe-orange-deep underline decoration-wavy decoration-santafe-orange underline-offset-4 hover:text-santafe-navy"
              >
                WhatsApp 11 91145-4499
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-dashed border-santafe-navy/30 pt-5 text-center">
            <p className="font-serif text-xs italic text-santafe-navy/60">
              © {new Date().getFullYear()} · Santa Fé · A Costela ·{' '}
              <span className="not-italic font-bold uppercase tracking-widest">
                Segunda Sem Folga
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM CTA — só mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-santafe-navy bg-santafe-navy px-4 py-3 text-santafe-cream shadow-[0_-4px_20px_rgba(0,0,0,0.4)] md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-santafe-orange">
              {!lote.esgotado ? `Lote ${lote.lote} · ${lote.restantes} vagas` : 'Esgotado'}
            </p>
            <p className="font-slab text-2xl leading-none text-santafe-cream">
              {!lote.esgotado ? formatBRL(lote.valorCentavos) : '—'}
            </p>
          </div>
          <a
            href="#inscricao"
            className="flex h-12 items-center justify-center rounded-md bg-santafe-orange px-5 font-display text-base uppercase tracking-wide text-santafe-black shadow-[0_3px_0_0_#8C4D11] active:translate-y-[3px] active:shadow-[0_0_0_0_#8C4D11]"
          >
            Garantir
          </a>
        </div>
      </div>

      {/* Spacer pra sticky bar não cobrir conteúdo */}
      <div className="h-20 md:hidden" />
    </main>
  );
}
