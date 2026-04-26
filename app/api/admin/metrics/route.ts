import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcularLoteAtual } from '@/lib/lote';
import { requireRoleApi } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const role = await requireRoleApi(['ADMIN']);
  if (!role) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });
  }

  const [pagantes, vips, faturamento, ultimas10, ultimaComandaPagante, lote] =
    await Promise.all([
      prisma.inscricao.count({
        where: { status: 'PAGA', valorCentavos: { gt: 0 } },
      }),
      prisma.inscricao.count({
        where: { status: 'PAGA', valorCentavos: 0, lote: 0 },
      }),
      prisma.inscricao.aggregate({
        where: { status: 'PAGA' },
        _sum: { valorCentavos: true },
      }),
      prisma.inscricao.findMany({
        where: { status: 'PAGA', valorCentavos: { gt: 0 } },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
      prisma.inscricao.aggregate({
        where: { numeroComanda: { lt: 300 } },
        _max: { numeroComanda: true },
      }),
      calcularLoteAtual(),
    ]);

  // Gráficos: agregação por hora (últimas 24h) e por dia (últimos 7 dias)
  // — só pagantes regulares pra mostrar atividade real de vendas
  const agora = new Date();
  const inicio24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  const inicio7d = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [pag24h, pag7d] = await Promise.all([
    prisma.inscricao.findMany({
      where: { status: 'PAGA', valorCentavos: { gt: 0 }, paidAt: { gte: inicio24h } },
      select: { paidAt: true },
    }),
    prisma.inscricao.findMany({
      where: { status: 'PAGA', valorCentavos: { gt: 0 }, paidAt: { gte: inicio7d } },
      select: { paidAt: true },
    }),
  ]);

  // Agrupa por hora (chave: ISO truncada na hora)
  const porHora = new Map<string, number>();
  for (const r of pag24h) {
    if (!r.paidAt) continue;
    const k = new Date(r.paidAt);
    k.setMinutes(0, 0, 0);
    const key = k.toISOString();
    porHora.set(key, (porHora.get(key) ?? 0) + 1);
  }

  const porDia = new Map<string, number>();
  for (const r of pag7d) {
    if (!r.paidAt) continue;
    const k = new Date(r.paidAt);
    k.setHours(0, 0, 0, 0);
    const key = k.toISOString().slice(0, 10);
    porDia.set(key, (porDia.get(key) ?? 0) + 1);
  }

  return NextResponse.json({
    pagas: pagantes,
    pagantes,
    vips,
    faturamentoCentavos: faturamento._sum.valorCentavos ?? 0,
    ultimaComanda: ultimaComandaPagante._max.numeroComanda ?? 0,
    lote,
    ultimas10,
    porHora: Array.from(porHora, ([k, v]) => ({ hora: k, qtd: v })).sort((a, b) =>
      a.hora.localeCompare(b.hora),
    ),
    porDia: Array.from(porDia, ([k, v]) => ({ dia: k, qtd: v })).sort((a, b) =>
      a.dia.localeCompare(b.dia),
    ),
  });
}
