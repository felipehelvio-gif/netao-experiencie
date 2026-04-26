import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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

export async function criarSessaoAdmin(): Promise<{ token: string; expiresAt: Date }> {
  const token = gerarToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.adminSession.create({ data: { token, expiresAt } });
  return { token, expiresAt };
}

export async function validarSessaoToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const s = await prisma.adminSession.findUnique({ where: { token } });
  if (!s) return false;
  if (s.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { id: s.id } }).catch(() => {});
    return false;
  }
  return true;
}

export async function getAdminTokenFromCookie(): Promise<string | null> {
  const c = cookies().get(ADMIN_COOKIE);
  return c?.value ?? null;
}

export async function isAdminAuth(): Promise<boolean> {
  const token = await getAdminTokenFromCookie();
  return validarSessaoToken(token);
}

export async function logoutAdmin(token: string | null | undefined): Promise<void> {
  if (!token) return;
  await prisma.adminSession.deleteMany({ where: { token } });
}
