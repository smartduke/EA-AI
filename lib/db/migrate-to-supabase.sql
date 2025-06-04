-- Migration script to move from NextAuth to Supabase
-- Run this manually in your database before running the drizzle migration

-- Step 1: Drop dependent constraints first
ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_Message_v2_id_fk";
ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_messageId_Message_id_fk";

-- Step 2: Drop dependent tables
DROP TABLE IF EXISTS "Vote_v2" CASCADE;
DROP TABLE IF EXISTS "Message_v2" CASCADE;

-- Step 3: Remove User table constraints
ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk";
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk";

-- Step 4: Drop User table
DROP TABLE IF EXISTS "User" CASCADE;

-- Step 5: Update Stream table structure
ALTER TABLE "Stream" DROP CONSTRAINT IF EXISTS "Stream_chatId_Chat_id_fk";
ALTER TABLE "Stream" DROP CONSTRAINT IF EXISTS "Stream_id_pk";

-- Now you can run: pnpm db:migrate 