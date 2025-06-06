import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
  decimal,
  date,
} from 'drizzle-orm/pg-core';

// Remove custom user table since Supabase handles user auth
// The user data will come from Supabase's auth.users table

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  // Reference Supabase auth.users UUID directly
  userId: uuid('userId').notNull(),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat> & {
  lastMessage?: string | null;
};

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://github.com/vercel/ai-chatbot/blob/main/docs/04-migrate-to-parts.md
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  attachments: json('attachments'),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://github.com/vercel/ai-chatbot/blob/main/docs/04-migrate-to-parts.md
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable('Vote', {
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  messageId: uuid('messageId')
    .notNull()
    .references(() => message.id),
  isUpvoted: boolean('isUpvoted').notNull(),
});

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable('Document', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  kind: varchar('kind', {
    enum: ['text', 'code', 'image', 'sheet'],
  })
    .notNull()
    .default('text'),
  // Reference Supabase auth.users UUID directly
  userId: uuid('userId').notNull(),
});

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    // Reference Supabase auth.users UUID directly
    userId: uuid('userId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable('Stream', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  // Reference Supabase auth.users UUID directly
  userId: uuid('userId').notNull(),
  object: json('object').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export type Stream = InferSelectModel<typeof stream>;

// SUBSCRIPTION TABLES

// User subscriptions table
export const userSubscription = pgTable('UserSubscription', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull(), // Reference to Supabase auth.users
  planType: varchar('planType', { enum: ['free', 'pro'] })
    .notNull()
    .default('free'),
  billingPeriod: varchar('billingPeriod', { enum: ['monthly', 'yearly'] }),
  status: varchar('status', {
    enum: ['active', 'canceled', 'expired', 'past_due'],
  })
    .notNull()
    .default('active'),
  currentPeriodStart: timestamp('currentPeriodStart'),
  currentPeriodEnd: timestamp('currentPeriodEnd'),
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').notNull().default(false),
  razorpaySubscriptionId: text('razorpaySubscriptionId'),
  razorpayCustomerId: text('razorpayCustomerId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type UserSubscription = InferSelectModel<typeof userSubscription>;

// Usage tracking table
export const usageTracking = pgTable('UsageTracking', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull(), // Reference to Supabase auth.users
  date: date('date').notNull(), // YYYY-MM-DD format
  searchesUsed: integer('searchesUsed').notNull().default(0),
  deepSearchesUsed: integer('deepSearchesUsed').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type UsageTracking = InferSelectModel<typeof usageTracking>;

// Payment transactions table
export const paymentTransaction = pgTable('PaymentTransaction', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull(), // Reference to Supabase auth.users
  razorpayPaymentId: text('razorpayPaymentId').notNull(),
  razorpayOrderId: text('razorpayOrderId').notNull(),
  razorpaySignature: text('razorpaySignature'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Amount in dollars
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', {
    enum: ['pending', 'completed', 'failed', 'refunded'],
  })
    .notNull()
    .default('pending'),
  planType: varchar('planType', { enum: ['free', 'pro'] }).notNull(),
  billingPeriod: varchar('billingPeriod', { enum: ['monthly', 'yearly'] }),
  metadata: json('metadata'), // Additional data from Razorpay
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type PaymentTransaction = InferSelectModel<typeof paymentTransaction>;

// User type for TypeScript - this will come from Supabase
export type User = {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string;
};
