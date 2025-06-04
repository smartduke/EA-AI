-- Fixed migration for Supabase transition
-- Only includes changes that haven't been applied yet

ALTER TABLE "Stream" RENAME COLUMN "chatId" TO "userId";
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_id_createdAt_pk";
ALTER TABLE "Stream" DROP CONSTRAINT IF EXISTS "Stream_id_pk";
ALTER TABLE "Stream" ADD PRIMARY KEY ("id");
ALTER TABLE "Document" ADD COLUMN "kind" varchar DEFAULT 'text' NOT NULL;
ALTER TABLE "Stream" ADD COLUMN "object" json NOT NULL;
ALTER TABLE "Stream" ADD COLUMN "updatedAt" timestamp NOT NULL;
ALTER TABLE "Document" DROP COLUMN IF EXISTS "text"; 