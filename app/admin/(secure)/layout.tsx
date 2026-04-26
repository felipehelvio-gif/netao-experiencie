import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuth } from '@/lib/auth';
import { LogoutButton } from '../LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminSecureLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAdminAuth();
  if (!ok) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-santafe-cream text-santafe-navy">
      <header className="border-b-2 border-santafe-navy bg-santafe-navy text-santafe-cream">
        <div className="container flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="font-display text-xl uppercase tracking-wider text-santafe-orange">
            Santa Fé · Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-bold uppercase">
            <Link href="/admin" className="rounded px-3 py-1 hover:bg-santafe-navy-deep">
              Dashboard
            </Link>
            <Link href="/admin/inscricoes" className="rounded px-3 py-1 hover:bg-santafe-navy-deep">
              Inscrições
            </Link>
            <Link href="/admin/checkin" className="rounded px-3 py-1 hover:bg-santafe-navy-deep">
              Check-in
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container px-4 py-6">{children}</main>
    </div>
  );
}
