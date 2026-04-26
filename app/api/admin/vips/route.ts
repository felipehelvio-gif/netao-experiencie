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
      // VIP: lote=0, valorCentavos=0, paidManually=true, status='PAGA' direto.
      const ultima = await tx.inscricao.aggregate({ _max: { numeroComanda: true } });
      const proximo = (ultima._max.numeroComanda ?? 0) + 1;

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
