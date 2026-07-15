# Avantpro PO

Dashboard local de sustentação para Product Owners, com sync Jira Cloud, snapshot em PostgreSQL e atualizações em tempo real via WebSockets.

## Stack

| Camada | Tech |
|--------|------|
| Web | React + Vite + Tailwind CSS v4 + Geist |
| API (BFF) | NestJS + Socket.IO |
| DB | PostgreSQL (snapshot completo das issues) |
| Cache / PubSub | Redis |
| Infra local | Docker Compose |

## Subir o ambiente

```bash
# 1. Copie env
cp .env.example .env

# 2. Postgres + Redis
docker compose up -d postgres redis

# 3. Schema
npm run db:push

# 4. API + Web (em terminais separados)
npm run dev:api
npm run dev:web
```

- Web: http://localhost:5173  
- API: http://localhost:3001/api  
- Webhook Jira: `POST http://localhost:3001/api/v1/webhooks/jira`  
  (use ngrok/cloudflared se quiser receber webhooks reais no Jira Cloud)

Stack completa em containers:

```bash
docker compose up -d --build
```

## Jira Cloud

Preencha no `.env`:

```env
JIRA_HOST=https://sua-empresa.atlassian.net
JIRA_EMAIL=seu-email@empresa.com
JIRA_API_TOKEN=...
```

### Fluxo (sem webhook secret)

1. Configure `JIRA_HOST`, `JIRA_EMAIL` e `JIRA_API_TOKEN` no `.env`
2. Adicione um board pelo `jiraBoardId` — o sync de **cards ativos** roda na hora
3. Enquanto a API estiver no ar, um cron a cada **1 hora** re-sincroniza ativos (`statusCategory != Done`, `SYNC_CRON_ENABLED=true`)
4. Sync manual: `POST /api/boards/:id/sync`
5. Webhooks ficam disponíveis em `/api/v1/webhooks/jira` quando você tiver o secret

## Funcionalidades (entrega 1)

- Lista avançada (default) + Kanban (Triagem / Dev / Validação)
- Drawer com **todos** os campos Jira (+ subtasks, estimativa, link direto)
- Query builder visual + filtros salvos
- Triage mode (setas / Enter / P / Esc)
- Métricas: lead time e bug/feature ratio
- Dark / Light mode
- Indicador **Live** (WebSocket)

## Monorepo

```
apps/api   NestJS BFF
apps/web   React SPA
```
