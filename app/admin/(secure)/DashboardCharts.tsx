'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

type Metrics = {
  porHora: { hora: string; qtd: number }[];
  porDia: { dia: string; qtd: number }[];
};

export function DashboardCharts() {
  const [data, setData] = React.useState<Metrics | null>(null);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/metrics', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (alive) setData({ porHora: j.porHora, porDia: j.porDia });
      } catch {}
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display text-lg uppercase">Pagamentos por hora · 24h</h3>
          <div className="mt-3 h-56">
            {data && data.porHora.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.porHora}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5d8c2" />
                  <XAxis
                    dataKey="hora"
                    stroke="#1B2B3F"
                    fontSize={11}
                    tickFormatter={(v: string) =>
                      new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit' }) + 'h'
                    }
                  />
                  <YAxis stroke="#1B2B3F" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v: string) =>
                      new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                    }
                  />
                  <Line type="monotone" dataKey="qtd" stroke="#F39C3C" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-santafe-navy/50">
                Sem dados ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-display text-lg uppercase">Pagamentos por dia · 7 dias</h3>
          <div className="mt-3 h-56">
            {data && data.porDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.porDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5d8c2" />
                  <XAxis
                    dataKey="dia"
                    stroke="#1B2B3F"
                    fontSize={11}
                    tickFormatter={(v: string) =>
                      new Date(v + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    }
                  />
                  <YAxis stroke="#1B2B3F" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v: string) =>
                      new Date(v + 'T00:00:00').toLocaleDateString('pt-BR')
                    }
                  />
                  <Bar dataKey="qtd" fill="#1B2B3F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-santafe-navy/50">
                Sem dados ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
