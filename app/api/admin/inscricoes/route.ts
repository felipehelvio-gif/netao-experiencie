import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Search permitido pra ADMIN e PORTARIA (portaria precisa pra buscar comandas)
  const role = await requireRoleApi(['ADMIN', 'PORTARIA']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status') as 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA' | null;
  const tipo = url.searchParams.get('tipo') as 'DONO' | 'FORNECEDOR' | 'OUTRO' | null;
  const q = url.searchParams.get('q')?.trim() ?? '';

  const where: any = {};
  if (status) where.status = status;
  if (tipo) where.tipo = tipo;
  if (q) {
    const numero = parseInt(q.replace(/\D/g, ''), 10);
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { whatsapp: { contains: q.replace(/\D/g, '') } },
      { email: { contains: q.toLowerCase(), mode: 'insensitive' } },
      ...(Number.isFinite(numero) ? [{ numeroComanda: numero }] : []),
    ];
  }

  const items = await prisma.inscricao.findMany({
    where,
    orderBy: [{ numeroComanda: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });

  return NextResponse.json({ items });
}
