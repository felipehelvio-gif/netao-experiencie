import { NextResponse } from 'next/server';
import { calcularLoteAtual } from '@/lib/lote';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const lote = await calcularLoteAtual();
    return NextResponse.json(lote, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[lote-atual] erro', err);
    return NextResponse.json({ erro: 'Falha ao calcular lote' }, { status: 500 });
  }
}
