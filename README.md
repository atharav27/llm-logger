# AI-BOT — LLM Inference Logger

A full-stack application for chatting with LLMs and logging inference metadata (tokens, latency, cost, provider/model usage) for analytics and debugging.

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 + Shadcn UI + TanStack Query |
| Backend | NestJS 10 + Prisma 7 + PostgreSQL |
| Infra | Docker Compose (one-command setup) |

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm
- Docker + Docker Compose (recommended)

---

### Option A — Docker Compose (Recommended)

```bash
git clone <your-repo-url>
cd AI-BOT
cp backend/.env.example backend/.env
```

Fill in your API keys in `backend/.env`:

```env
GEMINI_API_KEY=AIza...        # aistudio.google.com/apikey (free)
GROQ_API_KEY=gsk_...          # console.groq.com (free, 14400 req/day)
OPENROUTER_API_KEY=sk-or-...  # openrouter.ai (free models available)
```

Then start everything:

```bash
docker compose up --build
```

That's it. Services will be available at:

| Service | URL |
|---|---|
| Frontend | http://localhost:4000 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |

---

### Option B — Manual Setup

**Backend:**

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env values
npx prisma migrate dev
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL=http://localhost:3000 in .env.local
npm run dev
```

---

### Environment Variables

#### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_bot

# Auth
AUTH_JWT_SECRET=your_secret_here
AUTH_JWT_REFRESH_SECRET=your_refresh_secret_here

# LLM Providers (add keys for providers you want to use)
GEMINI_API_KEY=       # Free: 1500 req/day — aistudio.google.com/apikey
GROQ_API_KEY=         # Free: 14400 req/day — console.groq.com
OPENROUTER_API_KEY=   # Free models available — openrouter.ai

# App
HTTP_PORT=3000
APP_CORS_ORIGINS=http://localhost:4000
```

#### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Architecture Overview

### High-Level Flow

```
User (Browser)
     │
     │  1. Auth (JWT)
     ▼
Next.js Frontend ──── REST/SSE ────► NestJS Backend
     │                                     │
     │  2. Send message                    │  3. Call LLM provider
     │  3. Receive SSE stream              │     (Gemini / Groq / OpenRouter)
     │  4. Show metadata panel             │
     │                                4. Save message + inference log
     │                                5. Finalize log (tokens, latency, cost)
     │                                     │
     │                                     ▼
     │                               PostgreSQL
     │                               (conversations, messages,
     │                                inference_logs)
     │
     │  6. Dashboard analytics
     └──────────────────────────────► GET /analytics/overview
```

### Request Lifecycle (One Message)

```
1.  User types message → POST /conversations/:id/message
2.  Backend saves user message to DB
3.  Backend loads last 20 messages as LLM context
4.  Backend writes PENDING log to inference_logs (crash safety)
5.  Backend calls LLM provider (streaming)
6.  Each token SSE'd to frontend:
      data: {"type":"chunk","content":"The "}
      data: {"type":"chunk","content":"capital "}
      ...
7.  Stream ends → save assistant message to DB
8.  Finalize inference log (tokens, latency, cost)
9.  Send metadata event:
      data: {"type":"metadata","log":{"latencyMs":342,"inputTokens":45,...}}
10. Send done event:
      data: {"type":"done"}
```

### Backend Modules

```
src/
  auth/          JWT register, login, refresh, logout
  chat/          Conversations CRUD + SSE streaming + LLM providers
    llm/
      providers/
        gemini.provider.ts      Google Gemini (free tier)
        groq.provider.ts        Groq/Llama (free tier)
        openrouter.provider.ts  OpenRouter (free models)
  ingest/        Inference log finalization + cost calculation
  analytics/     Aggregated usage stats and time-series
  common/        Config, JWT guards, logger, health, shared infra
```

### Provider Architecture

All LLM providers implement a single `ILlmProvider` interface:

```typescript
interface ILlmProvider {
  sendMessage(params: LlmRequestParams): Promise<LlmStreamResult>
}
```

`LlmService` selects the right provider at runtime based on `conversation.provider`. Adding a new provider = implement the interface, register in the module. Nothing else changes.

### Supported Providers

| Provider | Models | Cost |
|---|---|---|
| Google Gemini | gemini-1.5-flash, gemini-2.0-flash | Free tier |
| Groq | llama-3.3-70b-versatile, llama-3.1-8b-instant | Free (14,400 req/day) |
| OpenRouter | deepseek/deepseek-v4-flash:free, google/gemma-4-31b-it:free | $0.00 |

---

## Schema Design Decisions

### Core Tables

```
users
  id, email, password_hash, name
  created_at, updated_at

conversations
  id, user_id (FK), title, status, model, provider
  system_prompt
  total_input_tokens, total_output_tokens, total_cost_usd  ← denormalized
  created_at, updated_at, cancelled_at

messages
  id, conversation_id (FK), role, content
  content_preview (200 chars)   ← pre-computed for list views
  sequence_number               ← explicit ordering, not timestamp-based
  token_count, created_at

inference_logs
  id, conversation_id (FK), message_id (FK, unique)
  provider, model
  input_tokens, output_tokens, total_tokens
  cost_usd
  latency_ms, time_to_first_token_ms
  status (PENDING → SUCCESS / ERROR / CANCELLED)
  stop_reason, error_code, error_message
  input_preview, output_preview (200 chars each)
  is_streaming, request_at, response_at
```

### Why These Decisions

**`sequence_number` on messages instead of ordering by `created_at`**
Timestamps can collide or be unreliable under concurrent writes. A monotonically incrementing integer guarantees correct conversation ordering always.

**Denormalized token/cost totals on `conversations`**
The conversation list page needs to show total tokens and cost per session. Running `SUM(inference_logs)` on every list load would be expensive. Pre-computing on the conversation row makes list queries O(1). Tradeoff: consistency requires careful increments on every log finalization — handled in `IngestService`.

**`content_preview` on messages**
Loading full message content for 20+ conversations just to show a 50-char sidebar preview is wasteful. Pre-computing 200 chars on write costs nothing and makes list views fast.

**`PENDING` status on inference logs**
The log row is written before the LLM call starts. If the server crashes mid-stream, the orphaned `PENDING` row is visible evidence — much better than missing data. A cleanup job can identify stale `PENDING` rows (no update in > 5 minutes).

**`message_id` as `@unique` on `inference_logs`**
Enforces the one-to-one relationship at the DB level. One assistant message = exactly one inference log. Prevents duplicate log entries from retry bugs.

**UUID primary keys**
Safe for distributed systems, future horizontal scaling, and avoids leaking record counts to clients.

---

## Tradeoffs Made

**Streaming over POST fetch instead of `EventSource`**
Standard `EventSource` doesn't support request bodies or custom headers, making auth impossible. Using `fetch` with a `ReadableStream` reader allows JWT auth in the header and a JSON body. Tradeoff: requires a custom SSE client utility on the frontend instead of the native browser API.

**Provider abstraction in backend, not frontend**
All LLM calls go through the backend. The frontend never touches provider APIs directly. Tradeoff: higher backend complexity, but API keys stay server-side only and provider logic is centralized.

**In-memory TTL cache for analytics**
Analytics queries (especially overview) aggregate across multiple tables. A simple in-memory Map with TTL avoids redundant DB hits for a single-instance deployment. Tradeoff: cache is not shared across instances — Redis would be needed for horizontal scaling.

**Prisma `$queryRaw` for analytics aggregates**
Prisma ORM cannot express `PERCENTILE_CONT`, `DATE_TRUNC`, or `FILTER (WHERE ...)` natively. Raw SQL is required for correct analytics. Tradeoff: loses ORM type safety, requires explicit UUID casting (`::uuid`) and enum casting (`::"log_status"`) in Postgres.

**Soft deletes (ARCHIVED status) instead of hard deletes**
Deleting a conversation would cascade-delete all its inference logs, destroying analytics history. Archiving hides it from the UI while preserving all data. Tradeoff: DB rows accumulate over time, requiring a periodic purge job for very old archived data.

**JWT in HttpOnly cookies + refresh token rotation**
Refresh tokens stored in DB allow server-side invalidation (logout from all devices). Rotation on every refresh means a stolen token can only be used once before it's invalidated. Tradeoff: cross-origin cookie behavior requires careful `SameSite` + `Secure` configuration for production deployments.

---

## What I Would Improve With More Time

### Reliability & Resilience

**Retry with exponential backoff on LLM rate limits**
Currently a `429` from Gemini surfaces as an error to the user. A proper retry strategy (3 attempts, 1s/2s/4s backoff with jitter) would silently recover from transient rate limits without the user seeing anything. This is especially important for free-tier providers with tight RPM limits.

**Circuit breaker per provider**
If Gemini returns 5 errors in 30 seconds, automatically route new requests to Groq until Gemini recovers. Currently the app retries the same failed provider. A circuit breaker pattern would make provider failover automatic and invisible to users.

**Cross-provider fallback chain**
Extend the current OpenRouter model fallback to work across providers: `Gemini → Groq → OpenRouter`. Each provider failing would automatically escalate to the next, giving much higher effective uptime for free-tier deployments.

### Observability

**Structured per-field error logging**
Current error logs print the full error object but key fields (`status`, `errorCode`, `model`) are buried in JSON. Standardizing to `logger.error('Provider error', { status, model, errorCode, message })` would make log parsing and alerting far easier.

**Request tracing**
Add `traceId` to every inference log and propagate it through SSE events to the frontend. When a user reports "my message at 2pm failed", you can immediately pull the full trace: HTTP request → LLM call → DB write → SSE response.

**Provider uptime dashboard**
Track success/error rates per provider over time. Surface this in the analytics dashboard so users can see which provider is most reliable for their usage pattern.

### Architecture

**Event-driven log ingestion with BullMQ**
Currently `IngestService.finalizeLog()` is called synchronously in the streaming path — a slow DB write adds latency to the response. Moving to a queue (BullMQ + Redis) would make log writes fully async: stream ends → emit event → worker processes log → no latency impact on user.

**WebSocket upgrade for chat**
SSE is one-directional (server → client). Moving to WebSocket would allow the server to push conversation updates in real time (e.g., another device sending a message in the same conversation) without polling.

**Conversation context summarization**
Currently the last 20 messages are sent verbatim as context. For very long conversations this wastes tokens and cost. Automatically summarizing older context (keeping recent messages + a running summary) would keep token usage low without losing conversation continuity.

### Features

**PII redaction before storage**
Strip emails, phone numbers, credit card numbers, and national IDs from messages before saving to the database. Regex-based first pass, ML-based (Presidio or similar) for higher accuracy. Critical for any deployment handling real user data.

**Conversation search**
Full-text search across message content using PostgreSQL `tsvector`. Users with many conversations need to find past discussions quickly.

**Export conversations**
Download a conversation as markdown or PDF. Useful for sharing AI-generated content or keeping records.

**Token budget warnings**
Alert users when a conversation is approaching the model's context limit, before it starts silently truncating history.

### Infrastructure

**CI/CD pipeline**
GitHub Actions workflow: lint → type-check → unit tests → migration safety check → Docker build → deploy. Currently deployments are manual.

**Self-hosted Kubernetes deployment**
Helm charts for backend, frontend, and PostgreSQL. Horizontal pod autoscaling on the backend based on active SSE connections. Currently only Docker Compose is provided.

**Database connection pooling**
Add PgBouncer in front of PostgreSQL for production. Prisma opens one connection per request without pooling, which exhausts connections under load.

---

## Repository Structure

```
AI-BOT/
├── backend/              # NestJS + Prisma API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/     # JWT auth
│   │   │   ├── chat/     # Conversations + LLM providers + SSE
│   │   │   ├── ingest/   # Log finalization + pricing
│   │   │   └── analytics/# Usage stats
│   │   └── common/       # Config, guards, logger, health
│   ├── prisma/
│   │   └── schema.prisma
│   └── docker-compose.yml
└── frontend/             # Next.js + Shadcn UI
    └── src/
        ├── app/          # App Router pages
        ├── components/   # UI components
        └── lib/          # API clients, hooks, stores
```

---

## Architecture Notes (Assignment)

### Ingestion Flow

1. LLM call starts → `PENDING` log written to DB immediately (crash safety)
2. Tokens stream to client via SSE
3. Stream ends → `IngestService.finalizeLog()` called with full metadata
4. Log updated to `SUCCESS` with tokens, latency, cost
5. Conversation token/cost totals incremented atomically
6. Assistant message linked to its inference log (powers per-message metadata panel)

### Logging Strategy

Every LLM API call produces exactly one `InferenceLog` row regardless of outcome. The row is created before the call (status: `PENDING`) and finalized after. This means:
- No lost logs on crash
- Failed calls are logged with `ERROR` status and error details
- Cancelled calls (user disconnect) are logged with `CANCELLED` status

### Scaling Considerations

- Analytics queries use indexed columns (`requestAt`, `status`, `provider/model`) and join through `conversations` to enforce user scoping
- Denormalized totals on `conversations` avoid expensive aggregations on the hot path
- Connection pooling (PgBouncer) would be added before horizontal scaling
- SSE connections are stateful — horizontal scaling requires sticky sessions or migration to WebSocket with a Redis pub/sub backplane

### Failure Handling Assumptions

- LLM provider errors are caught, logged, and surfaced to the client as SSE error events — the HTTP connection stays open
- Client disconnects are detected via `req.on('close')` — the LLM stream is aborted and the log is marked `CANCELLED`
- DB write failures in `finalizeLog` are swallowed (logged but not thrown) — a failed log write must never crash the streaming response
- Unhandled promise rejections are caught at the process level to prevent server crashes from provider SDK errors
