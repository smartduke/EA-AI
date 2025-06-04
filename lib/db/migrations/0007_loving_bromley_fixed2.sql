-- Fixed migration for Supabase transition - Part 2
-- Handles constraint dependencies and null values properly

-- First update Stream table structure
ALTER TABLE "Stream" RENAME COLUMN "chatId" TO "userId";

-- Add new columns with default values to handle existing data
ALTER TABLE "Stream" ADD COLUMN "object" json DEFAULT '{}';
ALTER TABLE "Stream" ADD COLUMN "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP;

-- Now make them NOT NULL
ALTER TABLE "Stream" ALTER COLUMN "object" SET NOT NULL;
ALTER TABLE "Stream" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Handle Document table
ALTER TABLE "Document" ADD COLUMN "kind" varchar DEFAULT 'text' NOT NULL;
ALTER TABLE "Document" DROP COLUMN IF EXISTS "text";

-- Fix Suggestion constraint by dropping and recreating it
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f";

-- Drop the old composite primary key
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_id_createdAt_pk";

-- Add simple primary key on id
ALTER TABLE "Document" ADD PRIMARY KEY ("id");

-- Update the foreign key reference in Suggestion table to just use document id
-- Note: This assumes you want to keep the suggestion references 