import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buscarPaymentMP } from '@/lib/mercadopago';
import { validarAssinaturaMP } from '@/lib/webhookSignature';
import { enviarWhatsappTexto, montarMensagemConfirmacao } from '@/lib/evolution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook do Mercado Pago.
 *
 * Fluxo:
 *  1. Validar HMAC (header `x-signature` + `x-request-id`).
 *  2. GET no payment via API (NUNCA confiar no body do webhook).
 *  3. Se status === 'approved' → transação atômica: PAGA + atribuir comanda.
 *  4. Disparar WhatsApp (falha não reverte pagamento).
 *  5. Se cancelled/rejected → EXPIRADA.
 *
 * Webhook precisa devolver 200 rápido senão o MP fica reenviando.
 */
export async function POST(req: NextRequest) {
  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: 'json inválido' }, { status: 400 });
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id') ?? req.headers.get('x-request-Id');
  const dataId = String(raw?.data?.id ?? raw?.data_id ?? '');

  // Em DEV permite testar sem assinatura (com body fake)
  const skipSig = process.env.NODE_ENV !== 'production' && process.env.MP_WEBHOOK_SECRET === undefined;

  if (!skipSig) {
    const sig = validarAssinaturaMP({
      xSignature,
      xRequestId,
      dataId,
      secret: process.env.MP_WEBHOOK_SECRET,
    });
    if (!sig.ok) {
      console.warn('[webhook MP] assinatura inválida:', sig.motivo);
      return NextResponse.json({ ok: false, erro: 'assinatura inválida' }, { status: 401 });
    }
  }

  // Aceita só action=payment.updated ou type=payment
  const tipo = raw?.type ?? raw?.action ?? '';
  if (!String(tipo).includes('payment')) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  if (!dataId) {
    return NextResponse.json({ ok: false, erro: 'data.id ausente' }, { status: 400 });
  }

  // GET no payment — fonte de verdade.
  let payment: any;
  try {
    payment = await buscarPaymentMP(dataId);
  } catch (err) {
    console.error('[webhook MP] erro buscar payment', err);
    // devolve 200 pra evitar tempestade de retries; logamos pra investigar
    return NextResponse.json({ ok: false, erro: 'falha ao buscar payment' }, { status: 200 });
  }

  const status = String(payment?.status ?? '');
  const inscricaoId = String(payment?.external_reference ?? '');
  const mpId = String(payment?.id ?? dataId);

  if (!inscricaoId) {
    console.warn('[webhook MP] payment sem external_reference', { mpId });
    return NextResponse.json({ ok: true, ignorado: 'sem external_reference' });
  }

  if (status === 'approved') {
    let comandaAtribuida: number | null = null;
    let inscricaoNome = '';
    let inscricaoWhatsapp = '';

    try {
      const result = await prisma.$transaction(async (tx) => {
        const ja = await tx.inscricao.findUnique({ where: { id: inscricaoId } });
        if (!ja) throw new Error('inscricao não encontrada');
        if (ja.status === 'PAGA') {
          return { idempotente: true, comanda: ja.numeroComanda, nome: ja.nome, whatsapp: ja.whatsapp };
        }

        const ultima = await tx.inscricao.aggregate({ _max: { numeroComanda: true } });
        const proximo = (ultima._max.numeroComanda ?? 0) + 1;

        const atualizada = await tx.inscricao.update({
          where: { id: inscricaoId },
          data: {
            status: 'PAGA',
            paidAt: new Date(),
            numeroComanda: proximo,
            mpPaymentId: mpId,
          },
        });

        return {
          idempotente: false,
          comanda: atualizada.numeroComanda!,
          nome: atualizada.nome,
          whatsapp: atualizada.whatsapp,
        };
      });

      comandaAtribuida = result.comanda ?? null;
      inscricaoNome = result.nome;
      inscricaoWhatsapp = result.whatsapp;

      // Se foi idempotente (já tava paga), não reenvia WhatsApp.
      if (!result.idempotente && comandaAtribuida != null) {
        const texto = montarMensagemConfirmacao({
          nome: inscricaoNome,
          numeroComanda: comandaAtribuida,
        });
        const env = await enviarWhatsappTexto({
          numero: inscricaoWhatsapp,
          texto,
        });
        if (env.ok) {
          await prisma.inscricao.update({
            where: { id: inscricaoId },
            data: { whatsappEnviadoEm: new Date(), whatsappErro: null },
          });
        } else {
          console.error('[webhook MP] falha WhatsApp', env);
          await prisma.inscricao.update({
            where: { id: inscricaoId },
            data: { whatsappErro: env.erro ?? 'erro desconhecido' },
          });
        }
      }
    } catch (err) {
      console.error('[webhook MP] erro transação', err);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true, comanda: comandaAtribuida });
  }

  if (status === 'cancelled' || status === 'rejected') {
    await prisma.inscricao
      .update({
        where: { id: inscricaoId },
        data: { status: 'EXPIRADA', mpPaymentId: mpId },
      })
      .catch(() => {});
    return NextResponse.json({ ok: true, status });
  }

  return NextResponse.json({ ok: true, status });
}

// MP às vezes faz GET pra verificar URL — devolvemos 200.
export async function GET() {
  return NextResponse.json({ ok: true });
}
