import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const transactionTypeEnum = pgEnum('transaction_type', [
  'transfer',
  'qris',
  'deposit',
  'withdrawal',
])

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'success',
  'failed',
  'flagged',
])

export const fraudSeverityEnum = pgEnum('fraud_severity', [
  'low',
  'medium',
  'high',
])

export const bankAccounts = pgTable('bank_accounts', {
  id: serial().primaryKey(),
  identityUserId: text('identity_user_id').notNull().unique(),
  accountNumber: text('account_number').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  balance: bigint('balance', { mode: 'number' }).notNull().default(1000000),
  pin: text('pin').default(''),
  avatarUrl: text('avatar_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const transactions = pgTable('transactions', {
  id: serial().primaryKey(),
  referenceId: text('reference_id').notNull().unique(),
  fromAccountId: integer('from_account_id').references(() => bankAccounts.id),
  toAccountId: integer('to_account_id').references(() => bankAccounts.id),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  description: text('description').default(''),
  merchantName: text('merchant_name').default(''),
  qrisCode: text('qris_code').default(''),
  fee: bigint('fee', { mode: 'number' }).notNull().default(0),
  transferType: text('transfer_type').default('internal'),
  bankCode: text('bank_code').default(''),
  method: text('method').default('bifast'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: serial().primaryKey(),
  accountId: integer('account_id').references(() => bankAccounts.id),
  action: text('action').notNull(),
  detail: text('detail').default(''),
  ipAddress: text('ip_address').default(''),
  userAgent: text('user_agent').default(''),
  createdAt: timestamp('created_at').defaultNow(),
})

export const fraudAlerts = pgTable('fraud_alerts', {
  id: serial().primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  accountId: integer('account_id').references(() => bankAccounts.id),
  severity: fraudSeverityEnum('severity').notNull(),
  reason: text('reason').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
})
