'use client';

import * as React from 'react';
import { Search, CheckCircle2, Loader2, Save, Camera, Image as ImageIcon } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatBRL, padComanda, formatarWhatsappBR } from '@/lib/utils';
import { CameraCapture } from '@/components/admin/CameraCapture';

type Inscricao = {
  id: string;
  numeroComanda: number | null;
  nome: string;
  whatsapp: string;
  tipo: 'DONO' | 'FORNECEDOR' | 'PRESTADOR' | 'OUTRO';
  restauranteNome: string | null;
  empresaNome: string | null;
  valorCentavos: number;
  status: 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA';
  checkedInAt: string | null;
  checkinFotoPath: string | null;
  notasOperacao: string | null;
};

export function CheckinClient({
  pagasInicial,
  presentesInicial,
}: {
  pagasInicial: number;
  presentesInicial: number;
}) {
  const { push } = useToast();
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Inscricao[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [presentes, setPresentes] = React.useState(presentesInicial);
  const pagas = pagasInicial;
  const [actionId, setActionId] = React.useState<string | null>(null);

  // Modal de câmera (controlado aqui, único modal compartilhado)
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [cameraTarget, setCameraTarget] = React.useState<Inscricao | null>(null);

  const buscar = React.useCallback(async (termo: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (termo) params.set('q', termo);
      const res = await fetch(`/api/admin/inscricoes?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        setItems(j.items.slice(0, 30));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (q.trim().length >= 2) buscar(q.trim());
      else setItems([]);
    }, 250);
    return () => clearTimeout(id);
  }, [q, buscar]);

  const removerPresenca = async (i: Inscricao) => {
    setActionId(i.id);
    try {
      const res = await fetch(`/api/inscricoes/${i.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presente: false }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((x) => (x.id === i.id ? { ...x, checkedInAt: null } : x)),
        );
        setPresentes((p) => Math.max(0, p - 1));
        push({ title: 'Presença removida', description: i.nome });
      } else {
        push({ title: 'Erro', variant: 'destructive' });
      }
    } finally {
      setActionId(null);
    }
  };

  const abrirCamera = (i: Inscricao) => {
    setCameraTarget(i);
    setCameraOpen(true);
  };

  const onCaptureFoto = async (blob: Blob) => {
    const target = cameraTarget;
    if (!target) return;
    const fd = new FormData();
    fd.append('foto', blob, `${target.id}.jpg`);
    try {
      const res = await fetch(`/api/inscricoes/${target.id}/check-in-foto`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        push({
          title: 'Falha ao subir foto',
          description: j?.erro ?? `HTTP ${res.status}`,
          variant: 'destructive',
        });
        return;
      }
      const j = await res.json();
      setItems((prev) =>
        prev.map((x) =>
          x.id === target.id
            ? { ...x, checkedInAt: j.checkedInAt ?? new Date().toISOString(), checkinFotoPath: j.fotoPath }
            : x,
        ),
      );
      // Se ainda não tava marcado presente, agora tá
      if (!target.checkedInAt) setPresentes((p) => p + 1);
      push({
        title: '✓ Entrada confirmada',
        description: `${target.nome} · foto salva`,
        variant: 'success',
      });
      setCameraOpen(false);
      setCameraTarget(null);
    } catch {
      push({ title: 'Erro de rede', variant: 'destructive' });
    }
  };

  const salvarNotas = async (id: string, notas: string) => {
    try {
      await fetch(`/api/inscricoes/${id}/notas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: notas || null }),
      });
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Header com contador */}
      <div className="rounded-md border-2 border-santafe-navy bg-santafe-navy p-4 text-santafe-cream">
        <p className="text-xs uppercase tracking-wider text-santafe-orange">Modo portaria</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="font-display text-5xl text-santafe-orange">{presentes}</span>
          <span className="pb-2 font-display text-xl text-santafe-cream/80">de {pagas} pagantes</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-santafe-navy/50" />
        <Input
          autoFocus
          inputMode="search"
          placeholder="Nome, últimos 4 dígitos ou número da comanda"
          className="h-14 pl-12 text-lg"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-santafe-navy/50" />
        </div>
      )}

      <div className="space-y-3">
        {items.map((i) => (
          <CheckinCard
            key={i.id}
            item={i}
            disabled={actionId === i.id}
            onAbrirCamera={() => abrirCamera(i)}
            onRemoverPresenca={() => removerPresenca(i)}
            onSaveNotas={(notas) => salvarNotas(i.id, notas)}
          />
        ))}

        {!loading && q.trim().length >= 2 && items.length === 0 && (
          <p className="py-12 text-center text-santafe-navy/60">Nada encontrado pra "{q}"</p>
        )}

        {q.trim().length < 2 && items.length === 0 && (
          <p className="py-12 text-center text-santafe-navy/60">
            Digita o nome, número da comanda ou últimos dígitos do telefone
          </p>
        )}
      </div>

      <CameraCapture
        open={cameraOpen}
        onOpenChange={(v) => {
          setCameraOpen(v);
          if (!v) setCameraTarget(null);
        }}
        onCapture={onCaptureFoto}
        headline={
          cameraTarget
            ? `${cameraTarget.nome} · #${padComanda(cameraTarget.numeroComanda ?? 0)}`
            : undefined
        }
      />
    </div>
  );
}

function CheckinCard({
  item,
  disabled,
  onAbrirCamera,
  onRemoverPresenca,
  onSaveNotas,
}: {
  item: Inscricao;
  disabled: boolean;
  onAbrirCamera: () => void;
  onRemoverPresenca: () => void;
  onSaveNotas: (notas: string) => void;
}) {
  const [notas, setNotas] = React.useState(item.notasOperacao ?? '');
  const [salvouNotas, setSalvouNotas] = React.useState(false);
  const [verFoto, setVerFoto] = React.useState(false);

  const presente = !!item.checkedInAt;
  const horario = item.checkedInAt
    ? new Date(item.checkedInAt).toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const fotoUrl = item.checkinFotoPath
    ? `/api/uploads/${item.checkinFotoPath}`
    : null;

  return (
    <div
      className={`overflow-hidden rounded-lg border-4 transition-colors ${
        presente
          ? 'border-emerald-600 bg-emerald-50'
          : item.status === 'PAGA'
          ? 'border-santafe-navy bg-santafe-cream'
          : 'border-amber-500 bg-amber-50'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-display text-5xl">
              {item.numeroComanda != null ? `#${padComanda(item.numeroComanda)}` : '—'}
            </p>
            <p className="mt-1 text-xl font-bold">{item.nome}</p>
            <p className="text-sm text-santafe-navy/70">
              {item.tipo === 'DONO' && (item.restauranteNome ?? 'Restaurante')}
              {item.tipo === 'FORNECEDOR' &&
                (item.empresaNome ? `${item.empresaNome} · fornecedor` : 'Fornecedor')}
              {item.tipo === 'PRESTADOR' &&
                (item.empresaNome
                  ? `${item.empresaNome} · prestador de serviço`
                  : 'Prestador de serviço')}
              {item.tipo === 'OUTRO' && 'Outro'}
            </p>
            <p className="font-mono text-xs text-santafe-navy/60">
              {formatarWhatsappBR(item.whatsapp)} · {formatBRL(item.valorCentavos)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {item.status !== 'PAGA' && <Badge variant="warning">Não pagou</Badge>}
            {fotoUrl && (
              <button
                type="button"
                onClick={() => setVerFoto(true)}
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border-2 border-emerald-600 bg-white transition-transform hover:scale-105"
                title="Ver foto da entrada"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoUrl} alt="Foto da entrada" className="h-full w-full object-cover" />
              </button>
            )}
          </div>
        </div>

        {/* Botão principal — exige foto */}
        {!presente ? (
          <button
            onClick={onAbrirCamera}
            disabled={disabled || item.status !== 'PAGA'}
            className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-xl font-bold uppercase text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            type="button"
          >
            {disabled ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Camera className="h-6 w-6" />
                Tirar foto e confirmar
              </>
            )}
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <div className="flex h-16 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-base font-bold uppercase text-white">
              <CheckCircle2 className="h-6 w-6" />
              Presente às {horario}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onAbrirCamera}
                disabled={disabled}
                className="flex h-7 items-center justify-center gap-1 rounded border-2 border-santafe-navy px-3 text-[10px] font-bold uppercase tracking-wider hover:bg-santafe-navy hover:text-santafe-cream disabled:opacity-50"
                title="Refazer foto"
                type="button"
              >
                <Camera className="h-3 w-3" />
                {item.checkinFotoPath ? 'Refazer foto' : 'Tirar foto'}
              </button>
              <button
                onClick={onRemoverPresenca}
                disabled={disabled}
                className="flex h-7 items-center justify-center gap-1 rounded border-2 border-destructive px-3 text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                type="button"
              >
                Desfazer
              </button>
            </div>
          </div>
        )}

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold uppercase text-santafe-navy/70">
            Notas (consumo extra, observações)
          </summary>
          <div className="mt-2 flex gap-2">
            <Textarea
              value={notas}
              onChange={(e) => {
                setNotas(e.target.value);
                setSalvouNotas(false);
              }}
              onBlur={() => {
                onSaveNotas(notas);
                setSalvouNotas(true);
                setTimeout(() => setSalvouNotas(false), 2000);
              }}
              placeholder="Ex: pediu vinho extra · pagou em dinheiro na hora"
              rows={2}
              className="text-sm"
            />
            {salvouNotas && (
              <span className="flex items-center text-xs text-emerald-700">
                <Save className="h-3 w-3" />
              </span>
            )}
          </div>
        </details>
      </div>

      {/* Lightbox foto */}
      {verFoto && fotoUrl && (
        <button
          onClick={() => setVerFoto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          type="button"
          aria-label="Fechar foto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoUrl}
            alt="Foto da entrada (cheia)"
            className="max-h-full max-w-full rounded-lg border-4 border-santafe-orange object-contain"
          />
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-santafe-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-santafe-navy">
            <ImageIcon className="mr-1 inline h-3 w-3" /> Toca pra fechar
          </span>
        </button>
      )}
    </div>
  );
}
