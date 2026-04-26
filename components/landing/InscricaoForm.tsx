'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/toast';
import { formatBRL, formatarWhatsappBR, isWhatsappValido } from '@/lib/utils';
import { PixModal } from './PixModal';

type Tipo = 'DONO' | 'FORNECEDOR' | 'OUTRO';

type LoteAtual =
  | { esgotado: false; lote: number; valorCentavos: number; restantes: number; totalPagos: number; capacidade: number }
  | { esgotado: true; totalPagos: number; capacidade: number };

type CriarResp = {
  id: string;
  valorCentavos: number;
  lote: number;
  expiresAt: string;
  pix: { qrCodeBase64: string; copyPaste: string };
};

export function InscricaoForm({ loteInicial }: { loteInicial: LoteAtual }) {
  const { push } = useToast();
  const [lote, setLote] = React.useState(loteInicial);

  const [nome, setNome] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [tipo, setTipo] = React.useState<Tipo>('DONO');
  const [restauranteNome, setRestauranteNome] = React.useState('');
  const [empresaNome, setEmpresaNome] = React.useState('');
  const [comoConheceu, setComoConheceu] = React.useState('');

  const [enviando, setEnviando] = React.useState(false);
  const [pix, setPix] = React.useState<CriarResp | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [erros, setErros] = React.useState<Record<string, string>>({});

  // Refresh do lote a cada 30s pra capturar mudanças.
  React.useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/lote-atual', { cache: 'no-store' });
        if (r.ok) {
          const j: LoteAtual = await r.json();
          setLote(j);
        }
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  if (lote.esgotado) {
    return <ListaEsperaForm />;
  }

  const valor = lote.valorCentavos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros({});
    const novosErros: Record<string, string> = {};

    if (nome.trim().length < 3) novosErros.nome = 'Nome muito curto';
    if (!isWhatsappValido(whatsapp)) novosErros.whatsapp = 'WhatsApp inválido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) novosErros.email = 'E-mail inválido';
    if (tipo === 'DONO' && restauranteNome.trim().length < 2) novosErros.restauranteNome = 'Informe o nome do restaurante';
    if (tipo === 'FORNECEDOR' && empresaNome.trim().length < 2) novosErros.empresaNome = 'Informe o nome da empresa';

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          whatsapp,
          email,
          tipo,
          restauranteNome: tipo === 'DONO' ? restauranteNome : undefined,
          empresaNome: tipo === 'FORNECEDOR' ? empresaNome : undefined,
          comoConheceu: tipo === 'OUTRO' ? comoConheceu || undefined : undefined,
          valorEsperadoCentavos: valor,
        }),
      });

      if (res.status === 410) {
        push({ title: 'Esgotou', description: 'As 220 vagas foram preenchidas.', variant: 'destructive' });
        const r = await fetch('/api/lote-atual');
        if (r.ok) setLote(await r.json());
        return;
      }

      if (res.status === 409) {
        const j = await res.json();
        push({
          title: 'O lote mudou',
          description: 'Atualizamos o valor — clique de novo pra continuar.',
          variant: 'destructive',
        });
        if (j.lote) setLote(j.lote);
        return;
      }

      if (res.status === 429) {
        push({ title: 'Calma aí', description: 'Aguarda 30 segundos e tenta de novo.', variant: 'destructive' });
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        push({
          title: 'Erro ao gerar PIX',
          description: j?.erro ?? 'Tenta de novo em instantes.',
          variant: 'destructive',
        });
        return;
      }

      const json: CriarResp = await res.json();
      setPix(json);
      setModalOpen(true);
    } catch {
      push({ title: 'Erro de rede', description: 'Verifica sua conexão.', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome completo *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            required
          />
          {erros.nome && <p className="text-xs text-destructive">{erros.nome}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <Input
            id="whatsapp"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatarWhatsappBR(e.target.value))}
            placeholder="(11) 98765-4321"
            autoComplete="tel"
            required
          />
          {erros.whatsapp && <p className="text-xs text-destructive">{erros.whatsapp}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            required
          />
          {erros.email && <p className="text-xs text-destructive">{erros.email}</p>}
        </div>

        <div className="grid gap-2">
          <Label>Você é *</Label>
          <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as Tipo)} className="grid gap-2">
            {[
              { v: 'DONO', label: 'Dono de restaurante' },
              { v: 'FORNECEDOR', label: 'Fornecedor de restaurante' },
              { v: 'OUTRO', label: 'Outro' },
            ].map((opt) => (
              <label
                key={opt.v}
                className="flex cursor-pointer items-center gap-3 rounded-md border-2 border-border bg-white px-4 py-3 transition-colors hover:border-santafe-navy/40 has-[:checked]:border-santafe-orange has-[:checked]:bg-santafe-orange/10"
              >
                <RadioGroupItem value={opt.v} id={`tipo-${opt.v}`} />
                <span className="font-medium text-santafe-navy">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {tipo === 'DONO' && (
          <div className="grid gap-2 animate-fade-in">
            <Label htmlFor="restaurante">Nome do restaurante *</Label>
            <Input
              id="restaurante"
              value={restauranteNome}
              onChange={(e) => setRestauranteNome(e.target.value)}
              placeholder="Ex: Santa Fé"
              required
            />
            {erros.restauranteNome && <p className="text-xs text-destructive">{erros.restauranteNome}</p>}
          </div>
        )}

        {tipo === 'FORNECEDOR' && (
          <div className="grid gap-2 animate-fade-in">
            <Label htmlFor="empresa">Nome da empresa *</Label>
            <Input
              id="empresa"
              value={empresaNome}
              onChange={(e) => setEmpresaNome(e.target.value)}
              placeholder="Ex: Distribuidora X"
              required
            />
            {erros.empresaNome && <p className="text-xs text-destructive">{erros.empresaNome}</p>}
          </div>
        )}

        {tipo === 'OUTRO' && (
          <div className="grid gap-2 animate-fade-in">
            <Label htmlFor="conheceu">Como conheceu o evento?</Label>
            <Textarea
              id="conheceu"
              value={comoConheceu}
              onChange={(e) => setComoConheceu(e.target.value)}
              placeholder="Indicação, Instagram, etc."
              rows={2}
            />
          </div>
        )}

        <Button type="submit" size="xl" disabled={enviando} className="mt-2">
          {enviando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando PIX...
            </>
          ) : (
            <>Pagar {formatBRL(valor)} via PIX</>
          )}
        </Button>

        <p className="text-center text-xs text-santafe-navy/70">
          Lote {lote.lote} · restam {lote.restantes} vagas neste valor
        </p>
      </form>

      <PixModal data={pix} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

function ListaEsperaForm() {
  const { push } = useToast();
  const [nome, setNome] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [feito, setFeito] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 3 || !isWhatsappValido(whatsapp)) {
      push({ title: 'Dados inválidos', variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/lista-espera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp }),
      });
      if (res.ok) {
        setFeito(true);
        push({ title: 'Tá na lista!', description: 'Avisamos se abrir vaga.', variant: 'success' });
      } else {
        push({ title: 'Erro', variant: 'destructive' });
      }
    } finally {
      setEnviando(false);
    }
  };

  if (feito) {
    return (
      <div className="rounded-md border-2 border-santafe-navy bg-santafe-navy p-6 text-center text-santafe-cream">
        <p className="font-display text-2xl uppercase">Tá na lista de espera 🤘</p>
        <p className="mt-2 text-sm">Se abrir vaga a gente te chama no WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border-2 border-destructive bg-destructive/10 p-6">
      <p className="text-center font-display text-2xl uppercase text-destructive">Esgotado</p>
      <p className="mb-4 mt-1 text-center text-sm text-santafe-navy">
        Entre na lista de espera. Avisamos pelo WhatsApp se abrir vaga.
      </p>
      <form onSubmit={submit} className="grid gap-3">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required />
        <Input
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatarWhatsappBR(e.target.value))}
          placeholder="(11) 98765-4321"
          required
        />
        <Button type="submit" disabled={enviando} variant="navy">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Quero ser avisado'}
        </Button>
      </form>
    </div>
  );
}
