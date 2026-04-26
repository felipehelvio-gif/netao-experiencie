import { normalizarWhatsapp, padComanda, primeiroNome } from './utils';

export type EnvioWhatsappResult = {
  ok: boolean;
  status?: number;
  body?: unknown;
  erro?: string;
};

// Workaround do bug do SWC/Next.js: emojis literais em template strings
// são double-escaped como \uXXXX literais no build de produção.
// Construímos os emojis em RUNTIME via String.fromCodePoint pra bypassar.
const EMOJI = {
  fire: String.fromCodePoint(0x1f525), // 🔥
  ticket: String.fromCodePoint(0x1f39f, 0xfe0f), // 🎟️
  calendar: String.fromCodePoint(0x1f4c5), // 📅
  clock: String.fromCodePoint(0x1f550), // 🕐
  pin: String.fromCodePoint(0x1f4cd), // 📍
  check: String.fromCodePoint(0x2705), // ✅
  rock: String.fromCodePoint(0x1f918), // 🤘
  camera: String.fromCodePoint(0x1f4f8), // 📸
};

export function montarMensagemConfirmacao(input: {
  nome: string;
  numeroComanda: number;
}): string {
  const pn = primeiroNome(input.nome);
  const comanda = padComanda(input.numeroComanda);
  return [
    `${EMOJI.fire} *SANTA FÉ EXPERIENCE* ${EMOJI.fire}`,
    '_segunda sem folga_',
    '',
    `Opa, ${pn}! Pagamento confirmado.`,
    '',
    `${EMOJI.ticket} *SUA COMANDA: #${comanda}*`,
    '',
    `${EMOJI.calendar} *27 de abril* · segunda-feira`,
    `${EMOJI.clock} *20h às 23h59*`,
    `${EMOJI.pin} *Rua Carlos Weber, 64* · Vila Leopoldina, SP`,
    '',
    `${EMOJI.check} Open food com cardápio especial`,
    `${EMOJI.check} Chopp, água e refrigerante liberados`,
    `${EMOJI.check} Música ao vivo`,
    '',
    `*${EMOJI.camera} TIRA UM PRINT DESSA TELA* — você apresenta o print ou o número da comanda na entrada do evento.`,
    '',
    `Te espero lá! ${EMOJI.rock}`,
    '_— Netão_',
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
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
        apikey: key,
      },
      body: JSON.stringify({
        number: numero,
        text: params.texto,
      }),
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
