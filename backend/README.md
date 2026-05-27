# AI-BOT Backend API

NestJS backend for the AI-BOT platform: user authentication, conversations, messages, and inference logging.

## Stack

- NestJS 10, TypeScript
- PostgreSQL + Prisma 7
- JWT access tokens + opaque DB-backed refresh tokens
- Pino logging, Sentry, Swagger (non-production)

## Prerequisites

- Node.js 20+
- PostgreSQL

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL and AUTH_JWT_SECRET in .env
npx prisma migrate dev
npm run dev
```

API base: `http://localhost:3000/api/v1`  
Swagger UI (non-production): `http://localhost:3000/api/docs`  
OpenAPI JSON: `http://localhost:3000/api/docs-json`

On startup, the server logs these URLs in the `Bootstrap` logger.

## Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login (rate-limited) |
| POST | `/api/v1/auth/refresh` | Rotate tokens (refresh cookie) |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/users/me` | Current user profile (Bearer or cookie) |

HttpOnly cookies: `ai-bot_user_access`, `ai-bot_user_refresh` (prefix configurable via `AUTH_COOKIE_PREFIX`). Refresh tokens are stateless JWTs (not stored in the database); logout clears cookies only.

## Chat endpoints

All chat routes require JWT (`Authorization: Bearer` or `ai-bot_user_access` cookie).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/conversations` | Create conversation |
| GET | `/api/v1/conversations` | List conversations (paginated) |
| GET | `/api/v1/conversations/:id` | Get conversation + messages + inference logs |
| DELETE | `/api/v1/conversations/:id` | Archive conversation (204) |
| POST | `/api/v1/conversations/:id/message` | Send message — SSE stream (optional `provider` + `model` in body) |
| GET | `/api/v1/llm/catalog` | List allowed providers and models |

**SSE events** (`POST .../message`):

- `{ "type": "chunk", "content": "..." }`
- `{ "type": "metadata", "log": { latencyMs, tokens, costUsd, provider, model, ... } }`
- `{ "type": "done" }`
- `{ "type": "error", "message": "..." }`

**Providers:** `GEMINI`, `GROQ` (default), `OPENROUTER`. Set `GEMINI_API_KEY`, `GROQ_API_KEY`, and/or `OPENROUTER_API_KEY` in `.env`. Use `GET /api/v1/llm/catalog` for the model allowlist. Send `provider` and `model` on `POST .../message` to change selection for that chat (persisted on the conversation).

## Inference logging (internal)

Chat streaming finalizes `InferenceLog` rows via `IngestService` (`finalizeLog`, `linkMessageToLog`) — no public ingest HTTP API.

## Analytics

Read-only dashboard overview scoped to the current user (via `conversations.userId`). Requires JWT.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/analytics/overview` | Totals, avg latency, success rate, 30-day requests/tokens series |

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | DB connectivity check |
| GET | `/api/v1/health/simple` | Liveness probe |

## Scripts

```bash
npm run dev          # watch mode
npm run build        # compile
npm run start:prod   # run dist/main.js
npm test             # unit tests
npm run lint         # eslint
```

## Database models

- `User` — authentication
- `Conversation`, `Message`, `InferenceLog` — chat and LLM analytics

## Project structure

```
src/
  common/       # shared infrastructure (JWT, DB, health, response)
  modules/
    auth/       # register, login, refresh, logout, users/me
    chat/       # conversations CRUD, SSE streaming, LlmService
    ingest/     # internal log finalization + pricing (used by chat LLM)
    analytics/  # dashboard aggregates (overview, latency, errors, throughput)
  app/
prisma/
```
