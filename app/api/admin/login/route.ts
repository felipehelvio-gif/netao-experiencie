import { NextRequest, NextResponse } from 'next/server';
import { adminLoginSchema } from '@/lib/schemas';
import { ADMIN_COOKIE, comparaSenha, criarSessao, logoutAdmin, type Role } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit({ key: `admin-login:${ip}`, windowMs: 60_000, max: 5 });
  if (!rl.ok) return NextResponse.json({ erro: 'Muitas tentativas' }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 });
  }

  let role: Role | null = null;
  if (comparaSenha(parsed.data.password, process.env.ADMIN_PASSWORD)) {
    role = 'ADMIN';
  } else if (comparaSenha(parsed.data.password, process.env.PORTARIA_PASSWORD)) {
    role = 'PORTARIA';
  }

  if (!role) {
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 });
  }

  const { token, expiresAt } = await criarSessao(role);
  const res = NextResponse.json({
    ok: true,
    role,
    redirect: role === 'PORTARIA' ? '/admin/checkin' : '/admin',
  });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const c = cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  await logoutAdmin(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: ADMIN_COOKIE, value: '', expires: new Date(0), path: '/' });
  return res;
}
