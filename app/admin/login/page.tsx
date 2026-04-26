'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/admin';

  const [password, setPassword] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({} as any));
        // Server diz pra onde mandar (PORTARIA → /admin/checkin)
        const dest = j?.redirect ?? next;
        router.push(dest);
        router.refresh();
        return;
      }
      const j = await res.json().catch(() => ({}));
      setErro(j?.erro ?? 'Erro');
    } catch {
      setErro('Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-lg border-2 border-santafe-orange bg-santafe-cream p-8 shadow-[6px_6px_0_0_#F39C3C]"
    >
      <div className="text-center">
        <Lock className="mx-auto h-10 w-10 text-santafe-orange" />
        <h1 className="mt-3 font-display text-3xl uppercase text-santafe-navy">Admin</h1>
        <p className="text-sm text-santafe-navy/70">Santa Fé Experience</p>
      </div>
      <div className="mt-6 grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
      <Button type="submit" className="mt-5 w-full" disabled={loading} size="lg">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-santafe-navy p-4">
      <React.Suspense fallback={null}>
        <LoginForm />
      </React.Suspense>
    </main>
  );
}
