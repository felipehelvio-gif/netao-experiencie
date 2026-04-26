import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuth } from '@/lib/auth';
import { checkinToggleSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuth())) {
    return NextResponse.json({ erro: 'não autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = checkinToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 });
  }

  const insc = await prisma.inscricao.findUnique({ where: { id: params.id } });
  if (!insc) return NextResponse.json({ erro: 'não encontrada' }, { status: 404 });

  const updated = await prisma.inscricao.update({
    where: { id: params.id },
    data: {
      checkedInAt: parsed.data.presente ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, checkedInAt: updated.checkedInAt });
}
