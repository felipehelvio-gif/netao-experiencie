'use client';

import * as React from 'react';
import { Loader2, MessageCircle, UserPlus, Search } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { formatarWhatsappBR, isWhatsappValido, padComanda } from '@/lib/utils';

type Vip = {
  id: string;
  nome: string;
  whatsapp: string;
  numeroComanda: number | null;
  paidAt: string | null;
  whatsappEnviadoEm: string | null;
  whatsappErro: string | null;
  checkedInAt: string | null;
  comoConheceu: string | null;
};

const TZ = { timeZone: 'America/Sao_Paulo' };

export function VipsClient() {
  const { push } = useToast();
  const [vips, setVips] = React.useState<Vip[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [nome, setNome] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [observacao, setObservacao] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);

  const [busca, setBusca] = React.useState('');

  const carregar = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vips', { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        setVips(j.items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 3) {
      push({ title: 'Nome muito curto', variant: 'destructive' });
      return;
    }
    if (!isWhatsappValido(whatsapp)) {
      push({ title: 'WhatsApp inválido', variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/admin/vips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp, observacao: observacao || undefined }),
      });
      if (res.ok) {
        const j = await res.json();
        push({
          title: 'VIP cadastrado!',
          description: `Comanda #${padComanda(j.comanda)} · WhatsApp disparado`,
          variant: 'success',
        });
        setNome('');
        setWhatsapp('');
        setObservacao('');
        carregar();
      } else {
        const j = await res.json().catch(() => ({}));
        push({ title: 'Erro', description: j?.erro, variant: 'destructive' });
      }
    } finally {
      setEnviando(false);
    }
  };

  const visiveis = vips.filter((v) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      v.nome.toLowerCase().includes(q) ||
      v.whatsapp.includes(q.replace(/\D/g, '')) ||
      String(v.numeroComanda ?? '').includes(q)
    );
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      {/* FORMULÁRIO */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-santafe-orange" />
            <h2 className="font-display text-2xl uppercase">Cadastrar VIP</h2>
          </div>
          <p className="mb-4 text-sm text-santafe-navy/70">
            Cria inscrição com comanda imediata e dispara WhatsApp de confirmação.
            Sem PIX, sem cobrança.
          </p>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do convidado"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatarWhatsappBR(e.target.value))}
                placeholder="(11) 98765-4321"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="obs">Observação (opcional)</Label>
              <Textarea
                id="obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: convidado do Netão · padrinho da casa"
                rows={2}
              />
            </div>
            <Button type="submit" disabled={enviando} size="lg" className="mt-2">
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando…
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Cadastrar e disparar WhatsApp
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* LISTA */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase">
              VIPs cadastrados <span className="text-santafe-orange">{vips.length}</span>
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-santafe-navy/50" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar"
                className="pl-9"
              />
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-santafe-navy/50" />
            </div>
          )}

          {!loading && visiveis.length === 0 && (
            <p className="py-12 text-center text-santafe-navy/60">
              {vips.length === 0
                ? 'Nenhum VIP ainda. Cadastra o primeiro pelo formulário ao lado.'
                : 'Nenhum resultado pra essa busca.'}
            </p>
          )}

          {!loading && visiveis.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-santafe-navy text-left">
                    <th className="px-2 py-2">Comanda</th>
                    <th className="px-2 py-2">Nome</th>
                    <th className="px-2 py-2">WhatsApp</th>
                    <th className="px-2 py-2">Cadastrado em</th>
                    <th className="px-2 py-2">WA</th>
                    <th className="px-2 py-2">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-santafe-cream/60">
                      <td className="px-2 py-2 font-display text-lg">
                        {v.numeroComanda != null ? `#${padComanda(v.numeroComanda)}` : '—'}
                      </td>
                      <td className="px-2 py-2 font-medium">
                        {v.nome}
                        {v.comoConheceu && (
                          <p className="mt-0.5 font-serif text-xs italic text-santafe-navy/60">
                            {v.comoConheceu.replace(/^\[VIP\]\s*/, '')}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {formatarWhatsappBR(v.whatsapp)}
                      </td>
                      <td className="px-2 py-2 text-xs text-santafe-navy/70">
                        {v.paidAt
                          ? new Date(v.paidAt).toLocaleString('pt-BR', {
                              ...TZ,
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-2 py-2">
                        {v.whatsappEnviadoEm ? (
                          <Badge variant="success" className="text-[10px]">
                            ENVIADO
                          </Badge>
                        ) : v.whatsappErro ? (
                          <Badge variant="destructive" className="text-[10px]" title={v.whatsappErro}>
                            ERRO
                          </Badge>
                        ) : (
                          <Badge variant="muted" className="text-[10px]">
                            —
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {v.checkedInAt ? (
                          <span className="text-emerald-700">
                            ✓{' '}
                            {new Date(v.checkedInAt).toLocaleTimeString('pt-BR', {
                              ...TZ,
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
