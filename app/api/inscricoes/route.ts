import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcularLoteAtual } from '@/lib/lote';
import { criarCobrancaPix } from '@/lib/mercadopago';
import { criarInscricaoSchema } from '@/lib/schemas';
import { rateLimit, sweepRateLimit } from '@/lib/rateLimit';
import { normalizarWhatsapp } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PIX_TTL_MIN = 30;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  sweepRateLimit();

  const ip = clientIp(req);
  const rl = rateLimit({ key: `inscricao:${ip}`, windowMs: 30_000, max: 1 });
  if (!rl.ok) {
    return NextResponse.json(
      { erro: 'Aguarda alguns segundos antes de tentar de novo' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const parsed = criarInscricaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Lote atual
  const lote = await calcularLoteAtual();
  if (lote.esgotado) {
    return NextResponse.json({ erro: 'esgotado' }, { status: 410 });
  }

  // Trava de concorrência: se cliente passou valorEsperado e diverge do atual, devolve 409.
  if (data.valorEsperadoCentavos && data.valorEsperadoCentavos !== lote.valorCentavos) {
    return NextResponse.json(
      {
        erro: 'lote_mudou',
        mensagem: 'O lote atual mudou — clique pra atualizar',
        lote,
      },
      { status: 409 },
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    return NextResponse.json({ erro: 'BASE_URL não configurado' }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + PIX_TTL_MIN * 60 * 1000);
  const whatsappNorm = normalizarWhatsapp(data.whatsapp);

  // 1) Cria a inscrição em estado PENDENTE pra ter o id (idempotencyKey do MP)
  const inscricao = await prisma.inscricao.create({
    data: {
      nome: data.nome,
      whatsapp: whatsappNorm,
      email: data.email,
      tipo: data.tipo,
      restauranteNome: data.tipo === 'DONO' ? data.restauranteNome : null,
      empresaNome: data.tipo === 'FORNECEDOR' ? data.empresaNome : null,
      comoConheceu: data.tipo === 'OUTRO' ? data.comoConheceu ?? null : null,
      lote: lote.lote,
      valorCentavos: lote.valorCentavos,
      status: 'PENDENTE',
      expiresAt,
    },
  });

  // 2) Cria cobrança PIX no MP
  let cobranca;
  try {
    cobranca = await criarCobrancaPix({
      inscricaoId: inscricao.id,
      valorCentavos: lote.valorCentavos,
      descricao: 'Santa Fé Experience - Ingresso',
      payerEmail: data.email,
      payerNome: data.nome,
      expiraEm: expiresAt,
      notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
    });
  } catch (err) {
    console.error('[inscricoes] falha MP', err);
    await prisma.inscricao.update({
      where: { id: inscricao.id },
      data: { status: 'CANCELADA' },
    });
    return NextResponse.json(
      { erro: 'Falha ao gerar cobrança PIX. Tenta de novo.' },
      { status: 502 },
    );
  }

  // 3) Persiste dados do PIX
  const atualizada = await prisma.inscricao.update({
    where: { id: inscricao.id },
    data: {
      mpPaymentId: cobranca.mpPaymentId,
      pixQrCode: cobranca.qrCodeBase64,
      pixCopyPaste: cobranca.copyPaste,
    },
  });

  return NextResponse.json({
    id: atualizada.id,
    valorCentavos: atualizada.valorCentavos,
    lote: atualizada.lote,
    expiresAt: atualizada.expiresAt.toISOString(),
    pix: {
      qrCodeBase64: cobranca.qrCodeBase64,
      copyPaste: cobranca.copyPaste,
    },
  });
}
