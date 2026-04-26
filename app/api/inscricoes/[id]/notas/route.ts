import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuth } from '@/lib/auth';
import { notasSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuth())) {
    return NextResponse.json({ erro: 'não autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = notasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 });
  }

  await prisma.inscricao.update({
    where: { id: params.id },
    data: { notasOperacao: parsed.data.notas },
  });

  return NextResponse.json({ ok: true });
}
