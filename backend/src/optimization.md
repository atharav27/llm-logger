# AI-BOT Backend — Optimization Roadmap

> Phase 1 (project restructuring) — **complete**  
> Phase 2 (security hardening) — **complete**  
> E-commerce cleanup + auth repurpose — **complete**  
> Phase 3 (chat, LLM SDK, SSE) — **complete**  
> Phase 4 (ingest module) — **complete**  
> Phase 5 (analytics module) — **complete**

---

## Current structure

```
src/
├── app/
│   └── app.module.ts
├── common/
│   ├── auth/           # JwtAuthModule (JWT strategy, guards, cookies)
│   ├── config/
│   ├── database/
│   ├── doc/
│   ├── health/
│   ├── helper/
│   ├── logger/
│   ├── request/
│   ├── response/
│   └── common.module.ts
├── modules/
│   ├── auth/           # register, login, refresh, logout, users/me
│   ├── chat/           # conversations CRUD, SSE, LlmService
│   ├── ingest/         # internal log finalization + pricing (chat LLM)
│   └── analytics/      # dashboard overview (GET /analytics/overview)
└── main.ts
prisma/
  └── schema.prisma     # User, Conversation, Message, InferenceLog
```

---

## Auth overview

- **Access:** short-lived JWT (`sub`, `email`, `actor: USER`, `type: access`).
- **Refresh:** stateless JWT (`type: refresh`) in HttpOnly cookie `ai-bot_user_refresh`; reused until expiry (no DB table).
- **Guards:** `JwtAccessGuard` + `@PublicRoute()` on auth endpoints.
- **Lockout:** failed login attempts on `User` (5 attempts → 15 min lock).

---

---

## Completed infrastructure

- Compression, Helmet, global ValidationPipe
- `@nestjs/throttler` (10 req/min global; login 5/min)
- Structured Pino logging
- Response interceptor: `{ statusCode, message, timestamp, data }`
- Terminus health checks (Prisma + simple liveness)
