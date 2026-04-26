import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth';
import { enviarWhatsappTexto, montarMensagemConfirmacao } from '@/lib/evolution';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const role = await requireRoleApi(['ADMIN']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

  const insc = await prisma.inscricao.findUnique({ where: { id: params.id } });
  if (!insc) return NextResponse.json({ erro: 'não encontrada' }, { status: 404 });
  if (insc.status !== 'PAGA' || insc.numeroComanda == null) {
    return NextResponse.json({ erro: 'inscrição ainda não está paga' }, { status: 400 });
  }

  const texto = montarMensagemConfirmacao({
    nome: insc.nome,
    numeroComanda: insc.numeroComanda,
  });
  const env = await enviarWhatsappTexto({ numero: insc.whatsapp, texto });

  if (env.ok) {
    await prisma.inscricao.update({
      where: { id: insc.id },
      data: { whatsappEnviadoEm: new Date(), whatsappErro: null },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.inscricao.update({
    where: { id: insc.id },
    data: { whatsappErro: env.erro ?? 'erro desconhecido' },
  });
  return NextResponse.json({ ok: false, erro: env.erro }, { status: 502 });
}
