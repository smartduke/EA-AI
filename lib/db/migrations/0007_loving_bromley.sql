DROP TABLE IF EXISTS "Message_v2";--> statement-breakpoint
DROP TABLE IF EXISTS "User";--> statement-breakpoint
DROP TABLE IF EXISTS "Vote_v2";--> statement-breakpoint
-- Only rename if chatId column exists (conditional DDL would need to be done differently in production)
-- ALTER TABLE "Stream" RENAME COLUMN "chatId" TO "userId";--> statement-breakpoint
ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Stream" DROP CONSTRAINT IF EXISTS "Stream_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_id_createdAt_pk";--> statement-breakpoint
ALTER TABLE "Stream" DROP CONSTRAINT IF EXISTS "Stream_id_pk";--> statement-breakpoint
-- Only add primary key if it doesn't exist
-- ALTER TABLE "Stream" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "Stream" ADD COLUMN IF NOT EXISTS "object" json NOT NULL DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "Stream" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "Document" DROP COLUMN IF EXISTS "text";