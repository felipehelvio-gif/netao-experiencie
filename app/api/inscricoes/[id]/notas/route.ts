import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth';
import { notasSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await requireRoleApi(['ADMIN', 'PORTARIA']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

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
