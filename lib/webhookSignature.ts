import crypto from 'crypto';

/**
 * Valida assinatura HMAC-SHA256 do webhook do Mercado Pago.
 * Formato do header `x-signature`: `ts=1234567890,v1=abcdef...`
 * Manifesto validado: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 */
export function validarAssinaturaMP(params: {
  xSignature: string | null | undefined;
  xRequestId: string | null | undefined;
  dataId: string | null | undefined;
  secret: string | undefined;
}): { ok: boolean; motivo?: string } {
  const { xSignature, xRequestId, dataId, secret } = params;

  if (!secret) return { ok: false, motivo: 'MP_WEBHOOK_SECRET não configurado' };
  if (!xSignature) return { ok: false, motivo: 'header x-signature ausente' };
  if (!xRequestId) return { ok: false, motivo: 'header x-request-id ausente' };
  if (!dataId) return { ok: false, motivo: 'data.id ausente no body' };

  const partes = xSignature.split(',').map((s) => s.trim());
  const kv: Record<string, string> = {};
  for (const p of partes) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    kv[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
  }

  const ts = kv['ts'];
  const v1 = kv['v1'];
  if (!ts || !v1) return { ok: false, motivo: 'x-signature sem ts ou v1' };

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  let ok = false;
  try {
    ok = crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    ok = false;
  }

  return ok ? { ok: true } : { ok: false, motivo: 'assinatura inválida' };
}
