import { prisma } from './prisma';

// Evento aconteceu em 27/04/2026, 20h às 23h59 BRT.
// Vendas encerram no FIM do evento (28/04 03:00 UTC = 28/04 00:00 BRT).
export const EVENTO_FIM = new Date('2026-04-28T03:00:00.000Z');

export type LoteAtual =
  | {
      esgotado: false;
      encerrado: false;
      lote: number;
      valorCentavos: number;
      restantes: number;
      totalPagos: number;
      capacidade: number;
      progresso: number;
      proximoLote: { lote: number; valorCentavos: number } | null;
      inicioLote: number;
      fimLote: number;
    }
  | {
      esgotado: true;
      encerrado: false;
      totalPagos: number;
      capacidade: number;
    }
  | {
      // Evento já passou — venda encerrada permanentemente
      encerrado: true;
      esgotado: false;
      totalPagos: number;
      capacidade: number;
    };

export const CAPACIDADE_TOTAL = 220;

export const TABELA_LOTES = [
  { lote: 1, ate: 100, valorCentavos: 20000 },
  { lote: 2, ate: 150, valorCentavos: 22000 },
  { lote: 3, ate: 180, valorCentavos: 25000 },
  { lote: 4, ate: 200, valorCentavos: 28000 },
  { lote: 5, ate: 220, valorCentavos: 30000 },
] as const;

export function eventoEncerrado(now: Date = new Date()): boolean {
  return now.getTime() >= EVENTO_FIM.getTime();
}

export function calcularLoteSync(totalPagos: number, now: Date = new Date()): LoteAtual {
  if (eventoEncerrado(now)) {
    return {
      encerrado: true,
      esgotado: false,
      totalPagos,
      capacidade: CAPACIDADE_TOTAL,
    };
  }

  for (let i = 0; i < TABELA_LOTES.length; i++) {
    const t = TABELA_LOTES[i];
    if (totalPagos < t.ate) {
      const inicioLote = i === 0 ? 0 : TABELA_LOTES[i - 1].ate;
      const fimLote = t.ate;
      const tamanhoLote = fimLote - inicioLote;
      const vendidosNoLote = totalPagos - inicioLote;
      const progresso = Math.max(0, Math.min(1, vendidosNoLote / tamanhoLote));
      const prox = TABELA_LOTES[i + 1];
      return {
        esgotado: false,
        encerrado: false,
        lote: t.lote,
        valorCentavos: t.valorCentavos,
        restantes: t.ate - totalPagos,
        totalPagos,
        capacidade: CAPACIDADE_TOTAL,
        progresso,
        inicioLote,
        fimLote,
        proximoLote: prox
          ? { lote: prox.lote, valorCentavos: prox.valorCentavos }
          : null,
      };
    }
  }
  return { esgotado: true, encerrado: false, totalPagos, capacidade: CAPACIDADE_TOTAL };
}

export async function calcularLoteAtual(): Promise<LoteAtual> {
  const totalPagos = await prisma.inscricao.count({
    where: { status: 'PAGA', valorCentavos: { gt: 0 } },
  });
  return calcularLoteSync(totalPagos);
}
