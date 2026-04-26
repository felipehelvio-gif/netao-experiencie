import { normalizarWhatsapp, padComanda, primeiroNome } from './utils';

export type EnvioWhatsappResult = {
  ok: boolean;
  status?: number;
  body?: unknown;
  erro?: string;
};

export function montarMensagemConfirmacao(input: {
  nome: string;
  numeroComanda: number;
}): string {
  const pn = primeiroNome(input.nome);
  const comanda = padComanda(input.numeroComanda);
  return [
    '🔥 *SANTA FÉ EXPERIENCE* 🔥',
    '',
    `Opa, ${pn}! Pagamento confirmado.`,
    '',
    `🎟️ *Sua comanda: #${comanda}*`,
    '',
    '📅 *27 de abril* · segunda-feira',
    '🕐 *20h às 23h59*',
    '📍 *Rua Carlos Weber, 64* · Vila Leopoldina, SP',
    '',
    '✅ Open food com cardápio especial',
    '✅ Chopp, água e refrigerante liberados',
    '✅ Música ao vivo',
    '',
    'Na entrada, mostra essa mensagem ou apresenta o número da sua comanda.',
    '',
    'Tô esperando você lá! 🤘',
    '— Netão',
  ].join('\n');
}

export async function enviarWhatsappTexto(params: {
  numero: string;
  texto: string;
}): Promise<EnvioWhatsappResult> {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!url || !key || !instance) {
    return { ok: false, erro: 'Evolution API não configurada' };
  }

  const numero = normalizarWhatsapp(params.numero);
  if (!numero) {
    return { ok: false, erro: 'Número inválido' };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
      },
      body: JSON.stringify({
        number: numero,
        text: params.texto,
      }),
      // 10s timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, status: res.status, body, erro: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, body };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}
