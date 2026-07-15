<p align="center">
  <img src="docs/logo.svg" alt="Avantpro" width="120" />
</p>

<h1 align="center">Avantpro PO</h1>

<p align="center">
  <strong>Dashboard local de sustentação para Product Owners</strong><br />
  Sync com Jira Cloud · snapshot em PostgreSQL · atualizações em tempo real
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/API-NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/Cache-Redis-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-UNLICENSED-lightgrey?style=flat-square" />
</p>

---

## O que é

O **Avantpro PO** é um BFF + frontend para triagem de Bugs e Melhorias da sustentação. Os cards do Jira ficam em snapshot local, com filtros, status de produto, notas PO e sync horária — sem depender só da UI do Jira.

| | |
|---|---|
| **Web (local)** | http://localhost:5173 |
| **Web (GitHub Pages)** | https://fornel07.github.io/avantpro-po/ |
| **API** | http://localhost:3001/api |
| **WebSocket** | http://localhost:3001/socket.io |

> **GitHub Pages** publica só o frontend (`apps/web`).  
> A API NestJS + Postgres + Redis continua local (ou em outro host).  
> Para apontar a SPA publicada a uma API, configure os secrets do repositório  
> `VITE_API_URL` e `VITE_WS_URL` (ex.: `https://sua-api.exemplo.com`).

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Web | React · Vite · Tailwind CSS v4 · Geist · TanStack Query |
| API (BFF) | NestJS · Prisma · Socket.IO |
| Banco | PostgreSQL (snapshot das issues) |
| Cache / PubSub | Redis |
| Infra local | Docker Compose |

```
apps/
  api/   → NestJS BFF + sync Jira + notes/status PO
  web/   → SPA React (overview + espaço por board)
```

---

## Subir o ambiente

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# Edite JIRA_HOST, JIRA_EMAIL e JIRA_API_TOKEN

# 3. Postgres + Redis
docker compose up -d postgres redis

# 4. Schema do banco
npm run db:push

# 5. API e Web (terminais separados)
npm run dev:api
npm run dev:web
```

Stack completa em containers:

```bash
docker compose up -d --build
```

---

## Configuração Jira

No `.env`:

```env
JIRA_HOST=https://sua-empresa.atlassian.net
JIRA_EMAIL=seu-email@empresa.com
JIRA_API_TOKEN=...          # https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_WEBHOOK_SECRET=        # opcional
SYNC_CRON_ENABLED=true
```

### Fluxo de sync

1. Preencha as credenciais no `.env`
2. **Importar boards** pela UI — sincroniza cards ativos (Bug / Melhoria; `IDEIA` traz todos os tipos)
3. Cron a cada **1 hora** re-sincroniza ativos (`statusCategory != Done`)
4. Sync manual: botão na UI ou `POST /api/boards/:id/sync` / `POST /api/boards/sync-all`
5. Webhook opcional: `POST /api/v1/webhooks/jira` (use ngrok/cloudflared se precisar)

---

## Funcionalidades

- **Dashboard geral** — todos os espaços · Bug & Melhoria
- **Espaço por projeto** — lista + Kanban, sprints ordenáveis
- **Filtros múltiplos** — query builder com chips (AND entre campos), busca debounce e filtros salvos
- **Status de produto** — select colorido ao lado da chave  
  `Devolvido para Dev` · `Aguardando Dev` · `Homologação` · `Concluído`
- **Nota PO** — post-it local por card (não sincroniza com o Jira)
- **Modal de detalhe** — campos Jira, subtasks e link direto
- **Realtime** — WebSocket com indicador Live
- **Dark / Light** mode
- **UI compacta** — filtros e espaços/boards colapsáveis

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev:api` | API em watch (`:3001`) |
| `npm run dev:web` | Vite (`:5173`) |
| `npm run db:push` | Aplica schema Prisma |
| `npm run build` | Build de todos os workspaces |
| `npm run docker:up` | Sobe stack Docker |
| `npm run docker:down` | Derruba stack Docker |

---

## Licença

UNLICENSED — uso interno Avantpro / Grupo RAM.
