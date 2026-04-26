import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

export const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export type Role = 'ADMIN' | 'PORTARIA';

export function gerarToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function comparaSenha(plain: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(plain);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function criarSessao(role: Role): Promise<{ token: string; expiresAt: Date }> {
  const token = gerarToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.adminSession.create({ data: { token, expiresAt, role } });
  return { token, expiresAt };
}

export async function getSessao(): Promise<{ ok: boolean; role: Role | null }> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return { ok: false, role: null };
  const s = await prisma.adminSession.findUnique({ where: { token } });
  if (!s) return { ok: false, role: null };
  if (s.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { id: s.id } }).catch(() => {});
    return { ok: false, role: null };
  }
  const role = (s.role === 'PORTARIA' ? 'PORTARIA' : 'ADMIN') as Role;
  return { ok: true, role };
}

// Backwards compat
export async function isAdminAuth(): Promise<boolean> {
  return (await getSessao()).ok;
}

/**
 * Garante que a sessão tem um dos roles permitidos.
 * Se não, redireciona pra /admin/login.
 * Em route handlers, usa `requireRoleApi` em vez disso.
 */
export async function requireRole(allowed: Role[]): Promise<Role> {
  const s = await getSessao();
  if (!s.ok || !s.role || !allowed.includes(s.role)) {
    redirect('/admin/login');
  }
  return s.role;
}

/**
 * Versão pra route handlers — devolve o role ou null. Não redireciona.
 */
export async function requireRoleApi(allowed: Role[]): Promise<Role | null> {
  const s = await getSessao();
  if (!s.ok || !s.role || !allowed.includes(s.role)) return null;
  return s.role;
}

export async function getAdminTokenFromCookie(): Promise<string | null> {
  const c = cookies().get(ADMIN_COOKIE);
  return c?.value ?? null;
}

export async function logoutAdmin(token: string | null | undefined): Promise<void> {
  if (!token) return;
  await prisma.adminSession.deleteMany({ where: { token } });
}
