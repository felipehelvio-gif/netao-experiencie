import { prisma } from './prisma';

export type LoteAtual =
  | {
      esgotado: false;
      lote: number;
      valorCentavos: number;
      restantes: number;
      totalPagos: number;
      capacidade: number;
      // Quanto do lote atual já foi vendido (0..1) — útil pra barra de progresso na landing
      progresso: number;
      // Próximo lote (se existir)
      proximoLote: { lote: number; valorCentavos: number } | null;
      // Onde começou esse lote (vendido até essa marca = 0% do lote)
      inicioLote: number;
      // Onde termina (vira o próximo)
      fimLote: number;
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
  return { esgotado: true, totalPagos, capacidade: CAPACIDADE_TOTAL };
}

export async function calcularLoteAtual(): Promise<LoteAtual> {
  // Conta APENAS pagantes regulares (valorCentavos > 0). VIPs (valorCentavos = 0) não
  // entram no controle de capacidade do evento — eles têm range próprio (#500..#301).
  const totalPagos = await prisma.inscricao.count({
    where: { status: 'PAGA', valorCentavos: { gt: 0 } },
  });
  return calcularLoteSync(totalPagos);
}
