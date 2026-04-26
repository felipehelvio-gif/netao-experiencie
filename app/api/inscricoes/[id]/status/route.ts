import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const insc = await prisma.inscricao.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      numeroComanda: true,
      paidAt: true,
      expiresAt: true,
      valorCentavos: true,
    },
  });
  if (!insc) return NextResponse.json({ erro: 'não encontrada' }, { status: 404 });
  return NextResponse.json(insc, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
