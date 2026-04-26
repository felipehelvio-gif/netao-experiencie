import { redirect } from 'next/navigation';
import { getSessao } from '@/lib/auth';
import { InscricoesTable } from './InscricoesTable';

export const dynamic = 'force-dynamic';

export default async function AdminInscricoesPage() {
  const sess = await getSessao();
  if (sess.role !== 'ADMIN') redirect('/admin/checkin');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl uppercase">Inscrições</h1>
        <a
          href="/api/admin/export"
          className="rounded-md border-2 border-santafe-navy bg-santafe-cream px-4 py-2 text-sm font-bold uppercase hover:bg-santafe-navy hover:text-santafe-cream"
        >
          Exportar CSV
        </a>
      </div>
      <InscricoesTable />
    </div>
  );
}
