# Santa Fé Experience — guia pro Claude

Sistema de venda de ingressos PIX + admin pro evento "Segunda Sem Folga · Santa Fé Experience" do Netão. **Edição 1: 27/04/2026, encerrada.** Site permanece no ar em modo "edição encerrada" — vendas travadas por data.

## Stack

- **Next.js 14** (App Router, TypeScript estrito, output `standalone`)
- **Tailwind** + utilities customizadas (paper grain, halftone, marquee, tape, ticket perforation, ember glow, live-dot, section-index)
- **Tipografia**: `Anton` (display), `Alfa Slab One` (slab/numbers), `Fraunces` (serif italic), `Inter` (body) — todas via `next/font/google`
- **Prisma 5** + **Postgres 16** (sem migrations versionadas — usamos `prisma db push --accept-data-loss` no boot)
- **Mercado Pago SDK v2** (`mercadopago` v2.x) — só PIX, com `idempotencyKey` na criação
- **Evolution API v2.3** (WhatsApp) em `evogo.kairulabs.com.br`, instância `Netao` (cap N)
- **shadcn-style components** escritos à mão (não rodei `npx shadcn init`)
- **Recharts** pro dashboard
- **`next/og`** pra OG image — **não funcionou** com `repeating-linear-gradient` no satori; **fallback é `app/opengraph-image.jpg` estático** (flyer oficial)

## Domínio + infra

- Domínio: **netao.kairulabs.com.br**
- Hospedagem: **Dokploy** em `76.13.224.200:3000` (panel)
  - Project: `Netão experiencie` (`projectId=jJsUo27_Gz-OT83rxmZiT`)
  - Application: `netao-experiencie` (`applicationId=TVlBFkyihqbFwvBSXT9DV`, swarm `netao-experiencie-1wbiyd`)
  - Postgres: `santafe-pg-bfj5db`, db `santafe`, user `santafe`
  - Volume: `santafe-uploads` montado em `/app/uploads` (fotos persistem entre redeploys)
- Repo: **github.com/felipehelvio-gif/netao-experiencie** (privado, autodeploy via GitHub App `Dokploy-2026-03-28-w6ct9s`)
- Senhas/keys ficam em `.env` local (gitignored). API keys do Dokploy + Evolution + MP estão expostas em chat com o user — **rotacionar antes de eventos sensíveis**.

## Estrutura

```
app/
  (public)/
    page.tsx                    # landing — hero + lotes + form ou bloco "encerrado"
    sucesso/[id]/page.tsx       # comanda gigante após pagamento confirmado
  admin/
    layout.tsx                  # passthrough
    LogoutButton.tsx
    login/page.tsx              # bare login (Suspense + useSearchParams)
    (secure)/                   # route group autenticado
      layout.tsx                # nav adaptativa por role + redirect /admin/login
      page.tsx                  # dashboard (6 cards + gráficos + últimas 10)
      DashboardCharts.tsx       # client component recharts
      inscricoes/{page,InscricoesTable}.tsx
      checkin/{page,CheckinClient}.tsx
      vips/{page,VipsClient}.tsx
  api/
    inscricoes/                 # POST cria, [id]/{status,check-in,notas,marcar-pago,reenviar-whatsapp,check-in-foto}
    webhooks/mercadopago/       # POST com HMAC + GET no payment + atribui comanda em txn atômica
    admin/{login,inscricoes,metrics,export,vips}/
    uploads/checkins/[file]/    # serve fotos auth-protected (ADMIN+PORTARIA)
    lote-atual/                 # GET (cliente faz polling)
    lista-espera/               # POST
    health/                     # GET healthcheck
  opengraph-image.jpg           # OG estático (compartilhamento WhatsApp)
  icon.jpg                      # favicon

components/
  ui/                           # button, input, label, dialog, card, badge, radio-group, toast (shadcn-style)
  landing/                      # InscricaoForm, PixModal, PratoSecreto
  admin/                        # CameraCapture (getUserMedia + canvas snapshot)

lib/
  prisma.ts                     # singleton client
  mercadopago.ts                # MP v2 SDK — criarCobrancaPix, buscarPaymentMP
  evolution.ts                  # WhatsApp + emojis via String.fromCodePoint (anti-bug SWC)
  webhookSignature.ts           # HMAC-SHA256 do MP (manifest: id;request-id;ts;)
  lote.ts                       # cálculo lote + EVENTO_FIM + eventoEncerrado()
  auth.ts                       # criarSessao(role), getSessao, requireRole/requireRoleApi
  schemas.ts                    # Zod schemas
  rateLimit.ts                  # in-memory bucket (single-replica)
  utils.ts                      # cn, formatBRL, padComanda, normalizarWhatsapp, formatarWhatsappBR

prisma/schema.prisma
Dockerfile                      # multi-stage, standalone, db push no CMD
middleware.ts                   # cookie check pra /admin/* + /api/admin/*
```

## Regras de negócio NÃO-NEGOCIÁVEIS

1. **Centavos internamente** (`valorCentavos: Int`). Conversão pra reais só na chamada do MP (`transaction_amount: valor/100`).
2. **Comanda sequencial atribuída em transação atômica** após `status === 'approved'` (webhook MP) ou após `marcar-pago manual`. **Range de comandas**:
   - **Pagantes regulares: 1–299** (capacidade total 220, mas algoritmo aceita até 299)
   - **VIPs: 500 → 301 decrescente** (200 max). Atribuído em `/api/admin/vips`.
   - Algoritmo pagante: `MAX(numeroComanda WHERE numeroComanda < 300) + 1`
   - Algoritmo VIP: `MIN(numeroComanda WHERE numeroComanda BETWEEN 301 AND 500) - 1`, default 500
3. **Idempotência MP**: `requestOptions.idempotencyKey = inscricao.id` na criação. Webhook checa `status === 'PAGA'` antes de atribuir comanda — não dispara WhatsApp duplicado.
4. **Sempre fazer GET no payment via API após webhook** — nunca confiar no body bruto. O body só traz `data.id`.
5. **HMAC obrigatório em produção** no `/api/webhooks/mercadopago` (`MP_WEBHOOK_SECRET`). Em dev, sem secret → pula validação.
6. **Falha no WhatsApp não reverte pagamento.** Loga em `whatsappErro`, expõe botão "Reenviar WA" no admin.
7. **Lote ativo conta SÓ pagantes regulares** (`valorCentavos > 0`) — VIPs não consomem capacidade.
8. **Trava de data**: `EVENTO_FIM = 2026-04-28T03:00:00Z` em `lib/lote.ts`. Após isso, `LoteAtual` retorna `encerrado: true` e POST `/api/inscricoes` + POST `/api/lista-espera` retornam HTTP 410.
9. **Validação Zod** em todas as rotas API. **Rate limit** em POST `/api/inscricoes` (1/30s/IP).

## Roles do admin

- **ADMIN** (`ADMIN_PASSWORD`): tudo — dashboard, inscrições, VIPs, check-in, exportar CSV, marcar pago manual, reenviar WhatsApp
- **PORTARIA** (`PORTARIA_PASSWORD`): só `/admin/checkin` (foto + presença + notas). Tentar acessar dashboard/inscricoes redireciona pra checkin
- Implementação: campo `role` em `AdminSession`, `requireRole(['ADMIN'])` ou `requireRoleApi(['ADMIN','PORTARIA'])` por rota

## Foto de check-in

- Câmera ao vivo via `getUserMedia` + canvas snapshot (component `CameraCapture`)
- POST multipart pra `/api/inscricoes/[id]/check-in-foto` (max 6MB, JPEG/PNG/WebP)
- Salvo em `/app/uploads/checkins/{cuid}-{timestamp}.{ext}` (volume Docker `santafe-uploads`)
- Serving auth-protected via `/api/uploads/checkins/[file]` (ADMIN+PORTARIA)
- Coluna `Inscricao.checkinFotoPath` salva caminho relativo
- **Permissão do volume**: container roda como `nextjs (uid 1001)`, mas volume Docker novo monta como `root`. Dockerfile pré-cria `/app/uploads` com `chown nextjs:nodejs` ANTES do `USER nextjs` pra resolver. Se aparecer EACCES de novo, rodar:
  ```bash
  docker exec --user root <container> chown -R 1001:65533 /app/uploads
  ```

## Bugs históricos & workarounds

### 1. Emojis WhatsApp viraram `\uXXXX` literais
**Causa**: SWC/Next.js compila template literals com emojis fora do BMP (surrogate pairs como 🔥, 🤘, 📅) com **double-escape** (`\\uD83D\\uDD25`) — string runtime contém o texto literal `🔥` em vez do emoji. Confirmado lendo o JS compilado em `.next/server/app/api/.../route.js`.
**Fix**: construir emojis em runtime via `String.fromCodePoint(0x1F525)`. Ver `lib/evolution.ts` const `EMOJI` e `app/(public)/sucesso/[id]/page.tsx` const `ROCK_HAND`.
**Não fazer**: voltar a usar emojis literais em template strings.

### 2. Comanda errada (#501+) pra pagantes
**Causa**: algoritmo usava `MAX(numeroComanda)` global. Após criar VIP teste #500, próximo pagante pegou #501.
**Fix**: filtrar `WHERE numeroComanda < 300` no aggregate dos pagantes. Aplicado no webhook MP + marcar-pago manual.

### 3. Busca por nome retornava todo o banco
**Causa**: `where.OR` incluía `whatsapp: { contains: '' }` (string vazia → SQL `LIKE '%%'` casa tudo).
**Fix**: só inclui filtro de whatsapp se `apenasDigitos.length >= 3`.

### 4. Botão "Copiar PIX" não funcionava
**Causa**: `onClick`/`onFocus` no input `data-pix-copypaste` faziam `select()`, e o clique no botão Copiar perdia foco.
**Fix**: removidos os handlers de seleção do input. Botão Copy agora tem fallback em 3 caminhos: `navigator.clipboard.writeText` → `document.execCommand('copy')` (Safari mobile) → seleciona o input pra copy manual.

### 5. OG image dinâmico (`next/og`) deu 502 / build error
**Causa**: `repeating-linear-gradient` não suportado pelo satori; `runtime: 'edge'` em Next standalone com `output: 'standalone'` não inclui o runtime.
**Fix**: `app/opengraph-image.jpg` estático (cópia do flyer oficial). Next pega automático.

### 6. Linha laranja vazada na página /sucesso
**Causa**: `<div className="absolute bottom-0">` sem `position: relative` no `<main>`.
**Fix**: substituí por `flex flex-col` + stripes no fluxo normal (`flex-shrink-0`).

### 7. Volume Docker uploads vazio sem permissão
**Causa**: container roda `nextjs:1001`, volume novo monta como `root:root`.
**Fix**: Dockerfile pré-cria `/app/uploads/checkins` com `chown nextjs:nodejs` antes do `USER nextjs`.

### 8. Build error: TS narrowing no `LoteAtual` com 3 variantes
**Causa**: ao adicionar `encerrado: true`, o tipo virou union de 3 variantes. `!lote.esgotado` não narrowa pra "tem `restantes`/`progresso`" porque `encerrado` também tem `esgotado: false`.
**Fix**: usar `!lote.esgotado && !lote.encerrado` (ou helper `const ativo = ...`).

## Variáveis de ambiente

```
DATABASE_URL=postgresql://santafe:PASS@santafe-pg-bfj5db:5432/santafe?schema=public
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=...
EVOLUTION_API_URL=https://evogo.kairulabs.com.br
EVOLUTION_API_KEY=...                  # global key (AUTHENTICATION_API_KEY do Evolution)
EVOLUTION_INSTANCE=Netao               # com N maiúsculo
ADMIN_PASSWORD=...
PORTARIA_PASSWORD=...
NEXT_PUBLIC_BASE_URL=https://netao.kairulabs.com.br
NODE_ENV=production
TZ=America/Sao_Paulo                   # crítico — afeta Date no Node
```

## Comandos comuns

```bash
# Dev local
npm install
cp .env.example .env  # preencher
npx prisma db push    # sincroniza schema
npm run dev           # http://localhost:3000

# Smoke test produção
curl https://netao.kairulabs.com.br/api/health
curl https://netao.kairulabs.com.br/api/lote-atual

# Logs container em prod
sshpass -p '<senha>' ssh root@76.13.224.200 \
  'docker logs --tail 100 netao-experiencie-1wbiyd.1.<task-id>'

# Acessar Postgres em prod
sshpass -p '<senha>' ssh root@76.13.224.200 \
  'docker exec santafe-pg-bfj5db.1.<task-id> psql -U santafe -d santafe'

# Criar/listar projeto via Dokploy API
curl -H "x-api-key: $DOKPLOY_KEY" http://76.13.224.200:3000/api/project.all

# Disparo manual WhatsApp (debug)
node -e "
const FIRE = String.fromCodePoint(0x1F525);
fetch('https://evogo.kairulabs.com.br/message/sendText/Netao', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: process.env.EVO_KEY },
  body: JSON.stringify({ number: '5511999999999', text: FIRE + ' teste' }),
}).then(r => r.json()).then(console.log)
"
```

## Como reabrir vendas pra próxima edição

1. **Ajustar `lib/lote.ts`**:
   - `EVENTO_FIM = new Date('YYYY-MM-DDT03:00:00.000Z')` pra próxima data
   - Atualizar `TABELA_LOTES` se preço/capacidade mudou
2. **Ajustar `lib/evolution.ts`** — texto da mensagem (data, local, copy)
3. **Ajustar `app/(public)/page.tsx`**:
   - `MARQUEE_TOP` (data)
   - `PARTICIPANTES`, `CARDAPIO`, `PratoSecreto` (REAL)
   - Date strings em vários lugares ("27 de abril")
4. **Ajustar `app/api/admin/vips/route.ts`** — `EVENTO_FIM` (variável local diferente da do `lib/lote.ts`)
5. **Limpar/arquivar inscrições da edição anterior** (decisão do user) ou começar do zero
6. **Testar** localmente com `npx prisma db push` + `npm run dev` antes de pushar
7. **Push** → autodeploy via GitHub App

## O que NÃO fazer

- Adicionar emojis literais em template strings de mensagens WhatsApp/SSR-rendered (use `String.fromCodePoint`)
- Usar `MAX(numeroComanda)` sem filtrar `< 300` pra pagantes
- Usar `repeating-linear-gradient` ou outras CSS funcs avançadas em `next/og` ImageResponse
- Confiar só no payload do webhook MP — sempre fazer GET no payment
- Commitar `.env` (já no `.gitignore`)
- Usar `cd <cwd> &&` em comandos Bash (já tá na cwd)
- Mexer no Dockerfile sem manter o pré-create de `/app/uploads` com chown

## Pessoas/credenciais (referência rápida)

- **Netão (anfitrião)**: WhatsApp `5511911454499` — owner da instância Evolution `Netao`
- **Felipe Helvio (operador, primeira inscrição #001)**: WhatsApp `5521983706066`
- **Site dúvidas exibido**: 11 91145-4499 (Netão)
- **GitHub App Dokploy**: `Dokploy-2026-03-28-w6ct9s`, instalada em `felipehelvio-gif`

## Padrões de código

- TypeScript estrito, no `any` exceto em `where: any = {}` do Prisma e payloads do MP (tipados como `any`)
- Server components por padrão, `'use client'` só quando necessário (form, modal, charts, camera)
- Datas formatadas com `toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', ... })` em todos os admins
- Senha admin guardada plain em env, comparação via `crypto.timingSafeEqual` pra evitar timing attacks
- Sessões em DB (`AdminSession`), TTL 24h, cookie httpOnly+sameSite=lax+secure em prod
