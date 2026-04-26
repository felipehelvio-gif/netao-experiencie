'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { formatBRL } from '@/lib/utils';

type Pix = {
  id: string;
  valorCentavos: number;
  expiresAt: string;
  pix: { qrCodeBase64: string; copyPaste: string };
};

type StatusResp = {
  id: string;
  status: 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA';
  numeroComanda: number | null;
};

export function PixModal({
  data,
  open,
  onOpenChange,
}: {
  data: Pix | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [copiado, setCopiado] = React.useState(false);
  const [restantes, setRestantes] = React.useState(0);

  // Polling de status
  React.useEffect(() => {
    if (!data || !open) return;
    let alive = true;
    let timer: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (!alive) return;
      try {
        const res = await fetch(`/api/inscricoes/${data.id}/status`, { cache: 'no-store' });
        const json: StatusResp = await res.json();
        if (json.status === 'PAGA') {
          push({ title: 'Pagamento confirmado!', description: 'Redirecionando…', variant: 'success' });
          router.push(`/sucesso/${json.id}`);
          return;
        }
        if (json.status === 'EXPIRADA' || json.status === 'CANCELADA') {
          push({ title: 'PIX expirado', description: 'Gera uma nova cobrança.', variant: 'destructive' });
          onOpenChange(false);
          return;
        }
      } catch {
        /* segue tentando */
      }
      timer = setTimeout(poll, 5000);
    };

    poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [data, open, router, push, onOpenChange]);

  // Timer
  React.useEffect(() => {
    if (!data || !open) return;
    const expira = new Date(data.expiresAt).getTime();
    const tick = () => {
      const r = Math.max(0, Math.floor((expira - Date.now()) / 1000));
      setRestantes(r);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data, open]);

  const min = String(Math.floor(restantes / 60)).padStart(2, '0');
  const sec = String(restantes % 60).padStart(2, '0');

  const copiar = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!data) return;
    const texto = data.pix.copyPaste;

    // 1) API moderna (HTTPS + secure context)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
        return;
      } catch {
        // segue pro fallback
      }
    }

    // 2) Fallback legado: textarea + execCommand (funciona em Safari mobile e contexts inseguros)
    try {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, texto.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
        return;
      }
    } catch {
      // último fallback abaixo
    }

    // 3) Último recurso: seleciona o input visível pra copiar manualmente
    const input = document.querySelector<HTMLInputElement>('input[data-pix-copypaste]');
    if (input) {
      input.focus();
      input.select();
    }
    push({
      title: 'Selecionei o código',
      description: 'Toca em "Copiar" do teclado ou faz Ctrl+C',
      variant: 'destructive',
    });
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pague com PIX</DialogTitle>
          <DialogDescription>
            <span className="text-base font-bold text-santafe-orange-dark">
              {formatBRL(data.valorCentavos)}
            </span>{' '}
            · após pagar você recebe a confirmação por WhatsApp com o número da sua comanda.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <img
            src={`data:image/png;base64,${data.pix.qrCodeBase64}`}
            alt="QR Code PIX"
            className="h-56 w-56 rounded-md border-2 border-santafe-navy bg-white p-2"
          />

          <div className="flex items-center gap-2 text-sm font-bold text-santafe-navy">
            <Clock className="h-4 w-4" />
            Expira em {min}:{sec}
          </div>

          <div className="w-full">
            <label className="text-xs font-semibold uppercase tracking-wide text-santafe-navy/70">
              Código copia-e-cola
            </label>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                data-pix-copypaste
                value={data.pix.copyPaste}
                className="flex-1 rounded-md border-2 border-border bg-white px-3 py-2 text-xs font-mono"
              />
              <Button onClick={(e) => copiar(e)} size="sm" type="button">
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-santafe-navy/70">
            Assim que o pagamento for confirmado essa tela atualiza sozinha.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
