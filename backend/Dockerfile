FROM node:20-alpine AS builder

WORKDIR /app

COPY .npmrc package.json package-lock.json ./
RUN npm ci

COPY . .
# prisma.config.ts reads DATABASE_URL via env(); .env is not in the image (.dockerignore).
# generate does not connect to the DB — any valid postgres URL is enough for the config loader.
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
RUN npx prisma generate && npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

# Run migrations then start (use `sh -c` so Windows CRLF in .sh files cannot break exec)
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main"]
