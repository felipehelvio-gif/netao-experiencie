import { MercadoPagoConfig, Payment } from 'mercadopago';

if (!process.env.MP_ACCESS_TOKEN) {
  // Não joga no top-level em build pra não quebrar `next build` antes do env estar setado.
  // Só logamos. As funções abaixo vão estourar quando chamadas sem env.
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[mercadopago] MP_ACCESS_TOKEN ausente — checkout não vai funcionar até configurar.');
  }
}

let _client: MercadoPagoConfig | null = null;
function client(): MercadoPagoConfig {
  if (!_client) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN não configurado');
    _client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 10000 },
    });
  }
  return _client;
}

export type CriarCobrancaPixInput = {
  inscricaoId: string;
  valorCentavos: number;
  descricao: string;
  payerEmail: string;
  payerNome: string;
  expiraEm: Date;
  notificationUrl: string;
};

export type CobrancaPixResult = {
  mpPaymentId: string;
  qrCodeBase64: string;
  copyPaste: string;
  status: string;
};

export async function criarCobrancaPix(input: CriarCobrancaPixInput): Promise<CobrancaPixResult> {
  const payment = new Payment(client());

  const partes = input.payerNome.trim().split(/\s+/);
  const firstName = partes[0] ?? input.payerNome;
  const lastName = partes.slice(1).join(' ') || firstName;

  const result = await payment.create({
    body: {
      transaction_amount: Number((input.valorCentavos / 100).toFixed(2)),
      description: input.descricao,
      payment_method_id: 'pix',
      payer: {
        email: input.payerEmail,
        first_name: firstName,
        last_name: lastName,
      },
      external_reference: input.inscricaoId,
      notification_url: input.notificationUrl,
      date_of_expiration: input.expiraEm.toISOString(),
    },
    requestOptions: {
      idempotencyKey: input.inscricaoId,
    },
  });

  const poi = (result as any)?.point_of_interaction?.transaction_data;
  const id = (result as any)?.id;
  if (!id || !poi?.qr_code || !poi?.qr_code_base64) {
    throw new Error('Resposta MP inválida — sem QR code');
  }

  return {
    mpPaymentId: String(id),
    qrCodeBase64: poi.qr_code_base64,
    copyPaste: poi.qr_code,
    status: String((result as any)?.status ?? 'pending'),
  };
}

export async function buscarPaymentMP(mpPaymentId: string) {
  const payment = new Payment(client());
  const result = await payment.get({ id: mpPaymentId });
  return result as any;
}
