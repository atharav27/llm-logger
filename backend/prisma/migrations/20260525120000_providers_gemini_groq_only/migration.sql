-- Remap legacy provider values before shrinking enum
UPDATE "conversations"
SET "provider" = 'GEMINI'
WHERE "provider"::text NOT IN ('GEMINI', 'GROK');

UPDATE "inference_logs"
SET "provider" = 'GEMINI'
WHERE "provider"::text NOT IN ('GEMINI', 'GROK');

CREATE TYPE "provider_new" AS ENUM ('GEMINI', 'GROQ');

ALTER TABLE "conversations" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "conversations" ALTER COLUMN "provider" TYPE "provider_new" USING (
  CASE "provider"::text
    WHEN 'GROQ' THEN 'GROQ'::"provider_new"
    WHEN 'GEMINI' THEN 'GEMINI'::"provider_new"
    WHEN 'GROK' THEN 'GROQ'::"provider_new"
    ELSE 'GEMINI'::"provider_new"
  END
);
ALTER TABLE "conversations" ALTER COLUMN "provider" SET DEFAULT 'GEMINI';

ALTER TABLE "inference_logs" ALTER COLUMN "provider" TYPE "provider_new" USING (
  CASE "provider"::text
    WHEN 'GROQ' THEN 'GROQ'::"provider_new"
    WHEN 'GEMINI' THEN 'GEMINI'::"provider_new"
    WHEN 'GROK' THEN 'GROQ'::"provider_new"
    ELSE 'GEMINI'::"provider_new"
  END
);

DROP TYPE "provider";
ALTER TYPE "provider_new" RENAME TO "provider";
