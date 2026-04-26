import { redirect } from 'next/navigation';
import { getSessao } from '@/lib/auth';
import { VipsClient } from './VipsClient';

export const dynamic = 'force-dynamic';

export default async function AdminVipsPage() {
  const sess = await getSessao();
  if (sess.role !== 'ADMIN') redirect('/admin/checkin');

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl uppercase">Gratuidades · VIPs</h1>
      <p className="text-sm text-santafe-navy/70">
        Cadastra um convidado especial — sem PIX, comanda atribuída na hora e mensagem WhatsApp disparada.
      </p>
      <VipsClient />
    </div>
  );
}
