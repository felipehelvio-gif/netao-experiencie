import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth';
import { enviarWhatsappTexto, montarMensagemConfirmacao } from '@/lib/evolution';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const role = await requireRoleApi(['ADMIN']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

  let comanda: number | null = null;
  let nome = '';
  let whatsapp = '';

  try {
    const result = await prisma.$transaction(async (tx) => {
      const insc = await tx.inscricao.findUnique({ where: { id: params.id } });
      if (!insc) throw new Error('not_found');
      if (insc.status === 'PAGA') {
        return { comanda: insc.numeroComanda, nome: insc.nome, whatsapp: insc.whatsapp, idempotente: true };
      }
      const ultima = await tx.inscricao.aggregate({ _max: { numeroComanda: true } });
      const proximo = (ultima._max.numeroComanda ?? 0) + 1;
      const upd = await tx.inscricao.update({
        where: { id: insc.id },
        data: {
          status: 'PAGA',
          paidAt: new Date(),
          paidManually: true,
          numeroComanda: proximo,
        },
      });
      return { comanda: upd.numeroComanda!, nome: upd.nome, whatsapp: upd.whatsapp, idempotente: false };
    });

    comanda = result.comanda ?? null;
    nome = result.nome;
    whatsapp = result.whatsapp;

    if (!result.idempotente && comanda != null) {
      const texto = montarMensagemConfirmacao({ nome, numeroComanda: comanda });
      const env = await enviarWhatsappTexto({ numero: whatsapp, texto });
      if (env.ok) {
        await prisma.inscricao.update({
          where: { id: params.id },
          data: { whatsappEnviadoEm: new Date(), whatsappErro: null },
        });
      } else {
        await prisma.inscricao.update({
          where: { id: params.id },
          data: { whatsappErro: env.erro ?? 'erro desconhecido' },
        });
      }
    }

    return NextResponse.json({ ok: true, comanda });
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') {
      return NextResponse.json({ erro: 'não encontrada' }, { status: 404 });
    }
    console.error('[marcar-pago]', err);
    return NextResponse.json({ erro: 'falha' }, { status: 500 });
  }
}
