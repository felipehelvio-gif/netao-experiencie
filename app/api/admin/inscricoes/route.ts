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
    const apenasDigitos = q.replace(/\D/g, '');
    const numero = apenasDigitos ? parseInt(apenasDigitos, 10) : NaN;
    const ors: any[] = [
      { nome: { contains: q, mode: 'insensitive' } },
      { email: { contains: q.toLowerCase(), mode: 'insensitive' } },
    ];
    // Só busca por whatsapp/comanda se tem dígitos suficientes — evita
    // que `whatsapp: { contains: '' }` retorne TODA a base quando busca é só letras.
    if (apenasDigitos.length >= 3) {
      ors.push({ whatsapp: { contains: apenasDigitos } });
    }
    if (Number.isFinite(numero)) {
      ors.push({ numeroComanda: numero });
    }
    where.OR = ors;
  }

  const items = await prisma.inscricao.findMany({
    where,
    orderBy: [{ numeroComanda: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });

  return NextResponse.json({ items });
}
