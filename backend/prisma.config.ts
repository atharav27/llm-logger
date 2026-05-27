import path from 'node:path';
import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

// Prisma 7 datasource: only `url` | `shadowDatabaseUrl` — no `directUrl`.
// Supabase: set DIRECT_URL (5432) for migrate/generate; pooler stays on DATABASE_URL for the app.
const cliDatabaseUrl = process.env.DIRECT_URL?.trim() || env('DATABASE_URL');

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: cliDatabaseUrl,
  },
});
