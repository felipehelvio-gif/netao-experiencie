import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireRoleApi } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/uploads/checkins';

export async function GET(
  _req: NextRequest,
  { params }: { params: { file: string } },
) {
  const role = await requireRoleApi(['ADMIN', 'PORTARIA']);
  if (!role) return new NextResponse('forbidden', { status: 403 });

  // Sanitização: aceitar só basename, sem `..`
  const base = path.basename(params.file);
  if (!/^[a-zA-Z0-9_.\-]+\.(jpg|jpeg|png|webp)$/.test(base)) {
    return new NextResponse('invalid', { status: 400 });
  }

  const filepath = path.join(UPLOAD_DIR, base);
  let data: Buffer;
  try {
    data = await fs.readFile(filepath);
  } catch {
    return new NextResponse('not found', { status: 404 });
  }

  const ext = path.extname(base).toLowerCase();
  const ct =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
      ? 'image/webp'
      : 'image/jpeg';

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'private, max-age=86400',
      'Content-Length': String(data.length),
    },
  });
}
