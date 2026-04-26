import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth';
import { enviarWhatsappTexto, montarMensagemConfirmacao } from '@/lib/evolution';
import { normalizarWhatsapp } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const vipSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => /^\d{10,13}$/.test(v.replace(/\D/g, '')), 'WhatsApp inválido'),
  observacao: z.string().trim().max(500).optional(),
});

const EVENTO_FIM = new Date('2026-04-28T03:00:00.000Z'); // 28/04 madrugada (fim do evento)

// VIPs ocupam comandas decrescentes a partir de 500 (1º VIP = #500, 2º = #499...).
// Limite: 200 VIPs (vai até #301 inclusive). Pagantes regulares ficam em 1-220.
const VIP_NUMERO_INICIAL = 500;
const VIP_NUMERO_MINIMO = 301; // 500 - 199 = 301; total 200 números (500..301)

export async function POST(req: NextRequest) {
  const role = await requireRoleApi(['ADMIN']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const parsed = vipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const whatsappNorm = normalizarWhatsapp(data.whatsapp);
  // Email único auto-gerado (campo é required) — usamos o whatsapp como base.
  const emailFake = `vip-${whatsappNorm}@gratuidade.santafe.local`;

  let comanda: number | null = null;
  let inscricaoId: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // VIPs: range decrescente 500 → 301. Pega o menor já atribuído (no range)
      // e desce 1; se ainda não tem nenhum, começa em 500.
      const ja = await tx.inscricao.aggregate({
        where: {
          lote: 0,
          valorCentavos: 0,
          numeroComanda: { gte: VIP_NUMERO_MINIMO, lte: VIP_NUMERO_INICIAL },
        },
        _min: { numeroComanda: true },
      });
      const proximo = ja._min.numeroComanda ? ja._min.numeroComanda - 1 : VIP_NUMERO_INICIAL;
      if (proximo < VIP_NUMERO_MINIMO) {
        throw new Error('limite_vip_atingido');
      }

      const novo = await tx.inscricao.create({
        data: {
          nome: data.nome,
          whatsapp: whatsappNorm,
          email: emailFake,
          tipo: 'OUTRO',
          comoConheceu: data.observacao
            ? `[VIP] ${data.observacao}`
            : '[VIP] Convidado especial · gratuidade',
          lote: 0,
          valorCentavos: 0,
          status: 'PAGA',
          paidAt: new Date(),
          paidManually: true,
          numeroComanda: proximo,
          expiresAt: EVENTO_FIM,
        },
      });

      return { id: novo.id, comanda: novo.numeroComanda!, nome: novo.nome, whatsapp: novo.whatsapp };
    });

    comanda = result.comanda;
    inscricaoId = result.id;

    // Dispara WhatsApp (não bloqueia em caso de falha)
    const texto = montarMensagemConfirmacao({ nome: result.nome, numeroComanda: comanda });
    const env = await enviarWhatsappTexto({ numero: result.whatsapp, texto });
    if (env.ok) {
      await prisma.inscricao.update({
        where: { id: inscricaoId },
        data: { whatsappEnviadoEm: new Date(), whatsappErro: null },
      });
    } else {
      await prisma.inscricao.update({
        where: { id: inscricaoId },
        data: { whatsappErro: env.erro ?? 'erro desconhecido' },
      });
    }

    return NextResponse.json({ ok: true, id: inscricaoId, comanda });
  } catch (err) {
    if (err instanceof Error && err.message === 'limite_vip_atingido') {
      return NextResponse.json(
        {
          erro:
            'Limite de 200 VIPs atingido (#500 ao #301). Pra liberar mais, deleta algum VIP existente.',
        },
        { status: 409 },
      );
    }
    console.error('[vips] erro', err);
    return NextResponse.json({ erro: 'falha ao criar VIP' }, { status: 500 });
  }
}

export async function GET() {
  const role = await requireRoleApi(['ADMIN']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

  // VIPs: valorCentavos === 0 e lote === 0 (marcadores)
  const vips = await prisma.inscricao.findMany({
    where: { valorCentavos: 0, lote: 0 },
    orderBy: { numeroComanda: 'asc' },
    select: {
      id: true,
      nome: true,
      whatsapp: true,
      numeroComanda: true,
      paidAt: true,
      whatsappEnviadoEm: true,
      whatsappErro: true,
      checkedInAt: true,
      comoConheceu: true,
    },
  });

  return NextResponse.json({ items: vips });
}
