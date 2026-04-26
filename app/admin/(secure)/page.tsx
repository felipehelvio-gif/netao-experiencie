import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calcularLoteAtual } from '@/lib/lote';
import { formatBRL, padComanda } from '@/lib/utils';
import { getSessao } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Ticket, TrendingUp, Hash } from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const sess = await getSessao();
  if (sess.role !== 'ADMIN') redirect('/admin/checkin');

  const [pagas, faturamento, ultimas10, ultimaComanda, lote] = await Promise.all([
    prisma.inscricao.count({ where: { status: 'PAGA' } }),
    prisma.inscricao.aggregate({ where: { status: 'PAGA' }, _sum: { valorCentavos: true } }),
    prisma.inscricao.findMany({
      where: { status: 'PAGA' },
      orderBy: { paidAt: 'desc' },
      take: 10,
    }),
    prisma.inscricao.aggregate({ _max: { numeroComanda: true } }),
    calcularLoteAtual(),
  ]);

  const restantes = lote.esgotado ? 0 : lote.restantes;
  const loteAtual = lote.esgotado ? '—' : `Lote ${lote.lote}`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl uppercase">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <Users className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Pagantes</span>
            </div>
            <p className="mt-2 font-display text-4xl">{pagas}</p>
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
            {!lote.esgotado && (
              <p className="text-xs text-santafe-navy/60">{formatBRL(lote.valorCentavos)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Vagas restantes</span>
            </div>
            <p className="mt-2 font-display text-4xl">{restantes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-santafe-navy/70">
              <Hash className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Última comanda</span>
            </div>
            <p className="mt-2 font-display text-4xl">
              #{padComanda(ultimaComanda._max.numeroComanda ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts />

      <Card>
        <CardContent className="p-5">
          <h2 className="font-display text-xl uppercase">Últimas 10 pagas</h2>
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
                      {i.tipo === 'DONO' ? i.restauranteNome : i.tipo === 'FORNECEDOR' ? i.empresaNome : 'Outro'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700">{formatBRL(i.valorCentavos)}</p>
                  <p className="text-xs text-santafe-navy/60">
                    {i.paidAt?.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) ?? ''}
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
