'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/login', { method: 'DELETE' });
        router.push('/admin/login');
        router.refresh();
      }}
      className="ml-2 flex items-center gap-1 rounded px-3 py-1 text-santafe-cream/80 hover:bg-santafe-navy-deep hover:text-santafe-cream"
      type="button"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  );
}
