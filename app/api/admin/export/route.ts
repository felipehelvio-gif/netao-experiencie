import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  if (!(await isAdminAuth())) {
    return NextResponse.json({ erro: 'não autenticado' }, { status: 401 });
  }

  const items = await prisma.inscricao.findMany({
    orderBy: [{ numeroComanda: 'asc' }, { createdAt: 'asc' }],
  });

  const headers = [
    'comanda',
    'nome',
    'whatsapp',
    'email',
    'tipo',
    'restaurante',
    'empresa',
    'comoConheceu',
    'lote',
    'valor_reais',
    'status',
    'pago_em',
    'pago_manual',
    'check_in_em',
    'whatsapp_enviado_em',
    'whatsapp_erro',
    'notas',
    'criado_em',
  ];

  const linhas = [headers.join(';')];
  for (const i of items) {
    linhas.push(
      [
        i.numeroComanda ?? '',
        i.nome,
        i.whatsapp,
        i.email,
        i.tipo,
        i.restauranteNome ?? '',
        i.empresaNome ?? '',
        i.comoConheceu ?? '',
        i.lote,
        (i.valorCentavos / 100).toFixed(2).replace('.', ','),
        i.status,
        i.paidAt?.toISOString() ?? '',
        i.paidManually ? 'sim' : 'não',
        i.checkedInAt?.toISOString() ?? '',
        i.whatsappEnviadoEm?.toISOString() ?? '',
        i.whatsappErro ?? '',
        i.notasOperacao ?? '',
        i.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(';'),
    );
  }

  const csv = '﻿' + linhas.join('\n'); // BOM pra Excel
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="santafe-inscricoes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
