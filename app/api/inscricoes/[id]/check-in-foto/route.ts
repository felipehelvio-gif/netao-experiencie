import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireRoleApi } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Volume Docker montado em /app/uploads — persistente entre redeploys.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/uploads/checkins';
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const role = await requireRoleApi(['ADMIN', 'PORTARIA']);
  if (!role) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });

  const insc = await prisma.inscricao.findUnique({ where: { id: params.id } });
  if (!insc) return NextResponse.json({ erro: 'não encontrada' }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ erro: 'multipart inválido' }, { status: 400 });
  }

  const file = formData.get('foto');
  if (!(file instanceof File)) {
    return NextResponse.json({ erro: 'campo "foto" ausente' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ erro: 'arquivo vazio' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ erro: 'arquivo muito grande (max 6MB)' }, { status: 413 });
  }

  // Aceita só JPEG/PNG/WebP. Se vier de canvas via toBlob, será image/jpeg.
  const ct = file.type.toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(ct)) {
    return NextResponse.json({ erro: 'formato não suportado' }, { status: 415 });
  }
  const ext = ct === 'image/png' ? 'png' : ct === 'image/webp' ? 'webp' : 'jpg';

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ts = Date.now();
  const filename = `${params.id}-${ts}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  // Caminho relativo salvo no DB (a rota de serving prefixe com UPLOAD_DIR)
  const relPath = `checkins/${filename}`;

  // Marca check-in se ainda não tinha; salva foto. Não sobrescreve checkedInAt
  // se já tava lá (admin editando) — só se for nulo.
  const updated = await prisma.inscricao.update({
    where: { id: params.id },
    data: {
      checkinFotoPath: relPath,
      ...(insc.checkedInAt ? {} : { checkedInAt: new Date() }),
    },
  });

  return NextResponse.json({
    ok: true,
    fotoPath: relPath,
    checkedInAt: updated.checkedInAt,
  });
}
