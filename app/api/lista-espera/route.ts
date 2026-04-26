import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listaEsperaSchema } from '@/lib/schemas';
import { rateLimit } from '@/lib/rateLimit';
import { normalizarWhatsapp } from '@/lib/utils';

export const runtime = 'nodejs';

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit({ key: `espera:${ip}`, windowMs: 30_000, max: 1 });
  if (!rl.ok) {
    return NextResponse.json({ erro: 'Aguarda alguns segundos' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const parsed = listaEsperaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 });
  }

  await prisma.listaEspera.create({
    data: {
      nome: parsed.data.nome,
      whatsapp: normalizarWhatsapp(parsed.data.whatsapp),
    },
  });

  return NextResponse.json({ ok: true });
}
