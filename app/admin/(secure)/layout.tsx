import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessao } from '@/lib/auth';
import { LogoutButton } from '../LogoutButton';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminSecureLayout({ children }: { children: React.ReactNode }) {
  const sess = await getSessao();
  if (!sess.ok || !sess.role) redirect('/admin/login');

  const isAdmin = sess.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-santafe-cream text-santafe-navy">
      <header className="border-b-2 border-santafe-navy bg-santafe-navy text-santafe-cream">
        <div className="container flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href={isAdmin ? '/admin' : '/admin/checkin'}
            className="font-display text-xl uppercase tracking-wider text-santafe-orange"
          >
            Santa Fé · {isAdmin ? 'Admin' : 'Portaria'}
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-bold uppercase">
            {isAdmin && (
              <>
                <Link href="/admin" className="rounded px-3 py-1 hover:bg-santafe-navy-deep">
                  Dashboard
                </Link>
                <Link
                  href="/admin/inscricoes"
                  className="rounded px-3 py-1 hover:bg-santafe-navy-deep"
                >
                  Inscrições
                </Link>
              </>
            )}
            <Link href="/admin/checkin" className="rounded px-3 py-1 hover:bg-santafe-navy-deep">
              Check-in
            </Link>
            {!isAdmin && (
              <Badge variant="warning" className="ml-2">
                Modo portaria
              </Badge>
            )}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container px-4 py-6">{children}</main>
    </div>
  );
}
