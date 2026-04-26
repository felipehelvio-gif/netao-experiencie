# Deploy — Santa Fé Experience

Stack: Next.js 14 (standalone) + Prisma + Postgres + Mercado Pago + Evolution API.

---

## 1. Pré-requisitos

- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers/) com app criado.
- Evolution API rodando em `https://evolutionapi.severina.top` (já temos).
- Dokploy com domínio `netao.kairulabs.com.br` apontado.

---

## 2. Variáveis de ambiente (Dokploy)

No serviço da aplicação, configure exatamente assim:

```
DATABASE_URL=postgresql://USER:PASS@HOST:5432/santafe?schema=public
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_WEBHOOK_SECRET=cole-aqui-a-chave-secreta-do-painel-MP
EVOLUTION_API_URL=https://evolutionapi.severina.top
EVOLUTION_API_KEY=sua-api-key-evolution
EVOLUTION_INSTANCE=nome-da-instancia
ADMIN_PASSWORD=defina-uma-senha-forte
NEXT_PUBLIC_BASE_URL=https://netao.kairulabs.com.br
NODE_ENV=production
```

> **`MP_ACCESS_TOKEN`**: use credencial **TEST_** em desenvolvimento e **APP_USR_** em produção.

---

## 3. Banco Postgres no Dokploy

1. Em "Bases de dados" no Dokploy, criar um Postgres 16.
2. Anotar a string de conexão (host interno do Dokploy + porta).
3. Colar em `DATABASE_URL` da aplicação.

A primeira migration roda automaticamente no boot do container (`prisma migrate deploy`). Mas você precisa **gerar** a migration localmente antes de subir (Prisma só aplica migrations já versionadas):

```bash
# localmente, com DATABASE_URL apontando pro Postgres do Dokploy ou um local:
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "init: prisma migration"
git push
```

Se preferir não usar migrations versionadas e só sincronizar schema (mais simples pro evento de amanhã):

```bash
# substitua o CMD do Dockerfile por:
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
```

`db push` força o schema do `schema.prisma` no banco — perfeito pra MVP, ruim pra produção de longo prazo.

---

## 4. Aplicação no Dokploy

1. **New Application → Docker** (ou Git, dependendo do Dokploy)
2. Repositório Git da aplicação OU build pelo Dockerfile
3. Build context: raiz · Dockerfile: `Dockerfile`
4. Porta interna: `3000`
5. Domínio: `netao.kairulabs.com.br`
6. **Habilitar Let's Encrypt** (Traefik faz isso automaticamente no Dokploy)
7. Health check (opcional): `GET /api/health`

---

## 5. Mercado Pago — Webhook

1. https://www.mercadopago.com.br/developers/panel → seu app
2. **Webhooks → Configurar notificações**
3. **URL de produção:** `https://netao.kairulabs.com.br/api/webhooks/mercadopago`
4. **Eventos:** marcar `Pagamentos` (`payment`)
5. Após salvar, a página exibe a **"Chave secreta"** — copie e cole em `MP_WEBHOOK_SECRET`
6. Use o botão "Simular notificação" pra testar

> ⚠️ **Sem `MP_WEBHOOK_SECRET`, o webhook é rejeitado.** Em dev local, você pode rodar com a env *ausente* (não vazia) que o código pula a validação. Em produção, sempre setar.

---

## 6. Evolution API — Instância

Você precisa de uma instância Evolution conectada ao número do WhatsApp que vai disparar as mensagens.

- **Reutilizar instância existente:** copie o nome dela em `EVOLUTION_INSTANCE` e a `apikey` em `EVOLUTION_API_KEY`. Vantagem: sem setup extra. Desvantagem: as mensagens do Santa Fé saem misturadas com outros usos.
- **Criar instância dedicada:** no painel da Evolution, crie uma nova instância (ex: `santafe-evento`), gere QR code, conecte um número WhatsApp dedicado. Use esse nome em `EVOLUTION_INSTANCE`.

Recomendado criar dedicada se for um número de WhatsApp Business só pro evento — fica mais profissional e separa logs.

---

## 7. DNS

No registrar do `kairulabs.com.br`, criar registro `A` ou `CNAME`:

```
netao.kairulabs.com.br → IP do Dokploy
```

O Traefik do Dokploy automaticamente provê SSL Let's Encrypt assim que o DNS resolver.

---

## 8. Verificação pós-deploy

```bash
# 1. Health
curl https://netao.kairulabs.com.br/api/health
# {"ok":true,"ts":...}

# 2. Lote atual
curl https://netao.kairulabs.com.br/api/lote-atual
# {"esgotado":false,"lote":1,"valorCentavos":20000,"restantes":100,...}

# 3. Landing
abrir https://netao.kairulabs.com.br no celular

# 4. Admin
abrir https://netao.kairulabs.com.br/admin/login
# usar ADMIN_PASSWORD

# 5. Webhook MP — disparar teste pelo painel do MP
# Conferir nos logs do container que retornou 200
```

---

## 9. Fluxo de teste end-to-end

1. Abrir `/` em modo anônimo, preencher form, gerar PIX
2. Em outra aba, **simular notificação** no painel MP com o `payment_id` retornado
3. A landing detecta via polling e redireciona pra `/sucesso/{id}` mostrando a comanda
4. WhatsApp chega no número informado (verifique logs Evolution se não chegar)
5. No `/admin`, ver a inscrição com `status=PAGA` e `numeroComanda` atribuído

---

## 10. Operação durante o evento

- **`/admin/checkin`** otimizado pra celular. Use no tablet/celular da portaria.
- Abrir o admin em **uma aba só** (sessão dura 24h).
- Se um pagamento real falhar de chegar via webhook (rede/timeout do MP), use **"Marcar pago manualmente"** na tabela `/admin/inscricoes` — atribui comanda automaticamente e dispara WhatsApp.
- Se o WhatsApp falhar, **"Reenviar WA"** na linha resolve.

---

## 11. Backup do banco (recomendado)

Antes do evento começar:

```bash
# de dentro do container postgres (ou via Dokploy)
pg_dump -U USER santafe > santafe-backup-$(date +%F).sql
```

Mantém uma cópia local. 220 inscritos é pouco, mas é caro perder.
