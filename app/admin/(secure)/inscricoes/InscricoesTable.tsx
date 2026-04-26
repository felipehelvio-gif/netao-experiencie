'use client';

import * as React from 'react';
import { Loader2, RotateCw, CheckCircle2, MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { formatBRL, padComanda, formatarWhatsappBR } from '@/lib/utils';

type Inscricao = {
  id: string;
  numeroComanda: number | null;
  nome: string;
  whatsapp: string;
  email: string;
  tipo: 'DONO' | 'FORNECEDOR' | 'OUTRO';
  restauranteNome: string | null;
  empresaNome: string | null;
  valorCentavos: number;
  status: 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA';
  paidAt: string | null;
  paidManually: boolean;
  checkedInAt: string | null;
  whatsappEnviadoEm: string | null;
  whatsappErro: string | null;
};

type Filtros = {
  status: '' | 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA';
  tipo: '' | 'DONO' | 'FORNECEDOR' | 'OUTRO';
  q: string;
};

const STATUS_BADGE: Record<string, { variant: any; label: string }> = {
  PAGA: { variant: 'success', label: 'Paga' },
  PENDENTE: { variant: 'warning', label: 'Pendente' },
  EXPIRADA: { variant: 'destructive', label: 'Expirada' },
  CANCELADA: { variant: 'muted', label: 'Cancelada' },
};

export function InscricoesTable() {
  const { push } = useToast();
  const [filtros, setFiltros] = React.useState<Filtros>({ status: '', tipo: '', q: '' });
  const [items, setItems] = React.useState<Inscricao[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionId, setActionId] = React.useState<string | null>(null);

  const carregar = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.status) params.set('status', filtros.status);
      if (filtros.tipo) params.set('tipo', filtros.tipo);
      if (filtros.q) params.set('q', filtros.q);
      const res = await fetch(`/api/admin/inscricoes?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        setItems(j.items);
      }
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  React.useEffect(() => {
    const id = setTimeout(carregar, 200);
    return () => clearTimeout(id);
  }, [carregar]);

  const marcarPago = async (id: string) => {
    if (!confirm('Confirma que essa pessoa pagou? Isso vai atribuir uma comanda e disparar o WhatsApp.')) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/inscricoes/${id}/marcar-pago`, { method: 'POST' });
      if (res.ok) {
        push({ title: 'Marcado como pago', variant: 'success' });
        carregar();
      } else {
        push({ title: 'Erro', variant: 'destructive' });
      }
    } finally {
      setActionId(null);
    }
  };

  const reenviarWhats = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/inscricoes/${id}/reenviar-whatsapp`, { method: 'POST' });
      if (res.ok) {
        push({ title: 'WhatsApp reenviado', variant: 'success' });
        carregar();
      } else {
        const j = await res.json().catch(() => ({}));
        push({ title: 'Falha', description: j?.erro, variant: 'destructive' });
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-santafe-navy/50" />
            <Input
              placeholder="Buscar por nome, telefone, email ou comanda"
              className="pl-10"
              value={filtros.q}
              onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <select
            value={filtros.status}
            onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value as any }))}
            className="h-12 rounded-md border-2 border-border bg-white px-3 text-sm font-medium"
          >
            <option value="">Todos os status</option>
            <option value="PAGA">Paga</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EXPIRADA">Expirada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value as any }))}
            className="h-12 rounded-md border-2 border-border bg-white px-3 text-sm font-medium"
          >
            <option value="">Todos os tipos</option>
            <option value="DONO">Dono</option>
            <option value="FORNECEDOR">Fornecedor</option>
            <option value="OUTRO">Outro</option>
          </select>
          <Button variant="outline" size="default" onClick={carregar} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-santafe-navy text-left">
                <th className="px-2 py-3">Comanda</th>
                <th className="px-2 py-3">Nome</th>
                <th className="px-2 py-3">WhatsApp</th>
                <th className="px-2 py-3">Tipo</th>
                <th className="px-2 py-3">Restaurante / Empresa</th>
                <th className="px-2 py-3">Valor</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Pago em</th>
                <th className="px-2 py-3">Check-in</th>
                <th className="px-2 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-santafe-navy/60">
                    Nenhuma inscrição encontrada
                  </td>
                </tr>
              )}
              {items.map((i) => {
                const sb = STATUS_BADGE[i.status];
                return (
                  <tr key={i.id} className="border-b border-border hover:bg-santafe-cream/60">
                    <td className="px-2 py-2 font-display text-lg">
                      {i.numeroComanda != null ? `#${padComanda(i.numeroComanda)}` : '—'}
                    </td>
                    <td className="px-2 py-2 font-medium">{i.nome}</td>
                    <td className="px-2 py-2 font-mono text-xs">{formatarWhatsappBR(i.whatsapp)}</td>
                    <td className="px-2 py-2">
                      <Badge variant="outline">{i.tipo}</Badge>
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {i.restauranteNome ?? i.empresaNome ?? '—'}
                    </td>
                    <td className="px-2 py-2 font-semibold">{formatBRL(i.valorCentavos)}</td>
                    <td className="px-2 py-2">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                      {i.paidManually && (
                        <span className="ml-1 text-[10px] uppercase text-santafe-navy/60">manual</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-santafe-navy/70">
                      {i.paidAt ? new Date(i.paidAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-2 py-2 text-xs text-santafe-navy/70">
                      {i.checkedInAt ? '✓ ' + new Date(i.checkedInAt).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {i.status !== 'PAGA' && (
                          <button
                            onClick={() => marcarPago(i.id)}
                            disabled={actionId === i.id}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Marcar pago
                          </button>
                        )}
                        {i.status === 'PAGA' && (
                          <button
                            onClick={() => reenviarWhats(i.id)}
                            disabled={actionId === i.id}
                            className="inline-flex items-center gap-1 rounded border-2 border-santafe-navy px-2 py-1 text-xs font-bold hover:bg-santafe-navy hover:text-santafe-cream disabled:opacity-50"
                            title={i.whatsappErro ?? undefined}
                          >
                            <MessageCircle className="h-3 w-3" />
                            {i.whatsappErro ? 'Reenviar (erro)' : 'Reenviar WA'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
