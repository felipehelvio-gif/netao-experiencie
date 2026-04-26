# Santa Fé Experience — Segunda Sem Folga

Landing + checkout PIX + painel admin pro evento de network de donos de restaurante.
Stack: Next.js 14 (App Router) · TypeScript · Tailwind · Prisma + Postgres · Mercado Pago · Evolution API.

## Rodando local

```bash
# 1. Instalar deps
npm install

# 2. Copiar env e preencher
cp .env.example .env
# (use TEST_ tokens do Mercado Pago em dev)

# 3. Subir Postgres local (ou apontar pra um existente)
# 4. Aplicar schema
npx prisma db push   # rápido, sem migrations
# OU
npx prisma migrate dev --name init   # com migrations versionadas

# 5. Dev server
npm run dev
# http://localhost:3000

# Admin
# http://localhost:3000/admin/login
# usa ADMIN_PASSWORD do .env
```

## Estrutura

```
app/
  (public)/page.tsx              # landing
  (public)/sucesso/[id]/page.tsx # COMANDA #XXX em destaque
  admin/login/page.tsx           # login (sem shell)
  admin/(secure)/                # área autenticada
    page.tsx                     # dashboard
    inscricoes/page.tsx          # tabela completa
    checkin/page.tsx             # modo portaria
  api/
    inscricoes/route.ts          # POST cria inscrição + PIX
    inscricoes/[id]/status/      # GET polling
    inscricoes/[id]/check-in/    # POST toggle presença
    inscricoes/[id]/notas/       # PATCH
    inscricoes/[id]/marcar-pago/ # POST manual
    inscricoes/[id]/reenviar-whatsapp/
    webhooks/mercadopago/        # POST webhook (HMAC-validado)
    lote-atual/                  # GET
    lista-espera/                # POST
    admin/login/                 # POST/DELETE
    admin/inscricoes/            # GET (autenticada)
    admin/metrics/               # GET (autenticada)
    admin/export/                # GET CSV
    health/                      # GET healthcheck

lib/
  prisma.ts            # client Prisma singleton
  mercadopago.ts       # criar PIX + buscar payment
  evolution.ts         # WhatsApp + template mensagem
  webhookSignature.ts  # HMAC-SHA256 do MP
  lote.ts              # cálculo do lote atual
  auth.ts              # admin sessions
  schemas.ts           # validações Zod
  rateLimit.ts         # rate limit em memória
  utils.ts             # cn, formatBRL, padComanda...

components/
  ui/                  # shadcn-style
  landing/             # InscricaoForm, PixModal

prisma/
  schema.prisma
```

## Princípios não-negociáveis

- **Centavos** internamente. Conversão pra reais só na chamada do MP.
- **Idempotência:** `idempotencyKey` na criação do PIX. Webhook idempotente via checagem `status === 'PAGA'` antes de atribuir comanda.
- **Comanda atribuída em transação atômica** com `aggregate({ _max: { numeroComanda } }) + 1` — race em pico de pagamentos é cenário real.
- **HMAC-SHA256 obrigatório** no webhook em produção.
- **GET no payment após webhook** — nunca confiar no payload bruto.
- **Rate limit** em `POST /api/inscricoes` (1/30s/IP).

## Deploy

Ver [DEPLOY.md](./DEPLOY.md).
