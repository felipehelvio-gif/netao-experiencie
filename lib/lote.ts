import { prisma } from './prisma';

export type LoteAtual =
  | {
      esgotado: false;
      lote: number;
      valorCentavos: number;
      restantes: number;
      totalPagos: number;
      capacidade: number;
    }
  | {
      esgotado: true;
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

export function calcularLoteSync(totalPagos: number): LoteAtual {
  for (const t of TABELA_LOTES) {
    if (totalPagos < t.ate) {
      return {
        esgotado: false,
        lote: t.lote,
        valorCentavos: t.valorCentavos,
        restantes: t.ate - totalPagos,
        totalPagos,
        capacidade: CAPACIDADE_TOTAL,
      };
    }
  }
  return { esgotado: true, totalPagos, capacidade: CAPACIDADE_TOTAL };
}

export async function calcularLoteAtual(): Promise<LoteAtual> {
  const totalPagos = await prisma.inscricao.count({
    where: { status: 'PAGA' },
  });
  return calcularLoteSync(totalPagos);
}
