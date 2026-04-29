import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calcularLoteAtual } from '@/lib/lote';
import { formatBRL, padComanda } from '@/lib/utils';
import { getSessao } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Ticket, TrendingUp, Hash, Star } from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sess = await getSessao();
  if (sess.role !== 'ADMIN') redirect('/admin/checkin');

  const [pagantes, vips, faturamento, ultimas10, ultimaComandaPagante, lote] =
    await Promise.all([
      // Pagantes regulares (valor > 0)
      prisma.inscricao.count({
        where: { status: 'PAGA', valorCentavos: { gt: 0 } },
      }),
      // VIPs (valor = 0 e lote = 0)
      prisma.inscricao.count({
        where: { status: 'PAGA', valorCentavos: 0, lote: 0 },
      }),
      // Faturamento — VIPs têm valor 0 então não somam
      prisma.inscricao.aggregate({
        where: { status: 'PAGA' },
        _sum: { valorCentavos: true },
      }),
      // Últimas 10 (pagantes regulares só, pra mostrar atividade real de vendas)
      prisma.inscricao.findMany({
        where: { status: 'PAGA', valorCentavos: { gt: 0 } },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
      // Última comanda de pagante regular (ignora VIPs em #500+)
      prisma.inscricao.aggregate({
        where: { numeroComanda: { lt: 300 } },
        _max: { numeroComanda: true },
      }),
      calcularLoteAtual(),
    ]);

  const ativo = !lote.esgotado && !lote.encerrado;
  const restantes = ativo ? lote.restantes : 0;
  const loteAtual = lote.encerrado
    ? 'Encerrado'
    : lote.esgotado
    ? '—'
    : `Lote ${lote.lote}`;
  const progressoPct = ativo ? Math.round(lote.progresso * 100) : 100;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl uppercase">Dashboard</h1>

      {/* Cards principais — 6 cards (pagantes, vips, faturamento, lote, vagas, última comanda) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <Users className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Pagantes</span>
            </div>
            <p className="mt-2 font-display text-4xl">{pagantes}</p>
            <p className="text-xs text-santafe-navy/60">de 220</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <Star className="h-4 w-4 text-santafe-orange" />
              <span className="text-xs font-bold uppercase">VIPs</span>
            </div>
            <p className="mt-2 font-display text-4xl text-santafe-orange-deep">{vips}</p>
            <p className="text-xs text-santafe-navy/60">de 200 · gratuidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Faturamento</span>
            </div>
            <p className="mt-2 font-display text-3xl text-emerald-700">
              {formatBRL(faturamento._sum.valorCentavos ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <Ticket className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Lote</span>
            </div>
            <p className="mt-2 font-display text-3xl">{loteAtual}</p>
            {ativo && (
              <>
                <p className="text-xs text-santafe-navy/60">{formatBRL(lote.valorCentavos)}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-santafe-navy/10">
                  <div
                    className="h-full bg-santafe-orange transition-all"
                    style={{ width: `${progressoPct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-santafe-navy/60">
                  {progressoPct}% vendido
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Vagas pagantes</span>
            </div>
            <p className="mt-2 font-display text-4xl">{restantes}</p>
            {ativo && lote.proximoLote && (
              <p className="text-xs text-santafe-navy/60">
                pra virar {formatBRL(lote.proximoLote.valorCentavos)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <Hash className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Última comanda</span>
            </div>
            <p className="mt-2 font-display text-4xl">
              #{padComanda(ultimaComandaPagante._max.numeroComanda ?? 0)}
            </p>
            <p className="text-xs text-santafe-navy/60">pagante (sem VIPs)</p>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts />

      <Card>
        <CardContent className="p-5">
          <h2 className="font-display text-xl uppercase">Últimas 10 pagas</h2>
          <p className="text-xs text-santafe-navy/60">só pagantes regulares · VIPs ficam em /admin/vips</p>
          <div className="mt-3 divide-y divide-border">
            {ultimas10.length === 0 && (
              <p className="py-8 text-center text-sm text-santafe-navy/60">
                Ninguém pagou ainda. As inscrições aparecem aqui.
              </p>
            )}
            {ultimas10.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Badge variant="navy" className="text-base">
                    #{padComanda(i.numeroComanda ?? 0)}
                  </Badge>
                  <div>
                    <p className="font-bold">{i.nome}</p>
                    <p className="text-xs text-santafe-navy/60">
                      {i.tipo === 'DONO' && (i.restauranteNome ?? 'Restaurante')}
                      {i.tipo === 'FORNECEDOR' && (i.empresaNome ?? 'Fornecedor')}
                      {i.tipo === 'PRESTADOR' && (i.empresaNome ?? 'Prestador de serviço')}
                      {i.tipo === 'OUTRO' && 'Outro'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700">{formatBRL(i.valorCentavos)}</p>
                  <p className="text-xs text-santafe-navy/60">
                    {i.paidAt?.toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }) ?? ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
