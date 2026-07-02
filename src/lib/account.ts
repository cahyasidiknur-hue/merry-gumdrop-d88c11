import { createServerFn } from '@tanstack/react-start'
import { db } from '../../db/index.js'
import { bankAccounts } from '../../db/schema.js'
import { requireAuthMiddleware } from '../middleware/identity.js'
import { eq } from 'drizzle-orm'

function generateAccountNumber(): string {
  return '8' + Math.floor(Math.random() * 9000000000 + 1000000000).toString()
}

export const getOrCreateAccount = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const { user } = context
    const existing = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.identityUserId, user.id))
      .limit(1)

    if (existing.length > 0) return existing[0]

    const [account] = await db
      .insert(bankAccounts)
      .values({
        identityUserId: user.id,
        accountNumber: generateAccountNumber(),
        fullName: user.name || user.email.split('@')[0],
        email: user.email,
        balance: 50000000,
      })
      .returning()

    return account
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context, data }: { context: any; data: { fullName?: string; phone?: string } }) => {
    const { user } = context
    const [account] = await db
      .update(bankAccounts)
      .set({
        fullName: data.fullName,
        phone: data.phone,
        updatedAt: new Date(),
      })
      .where(eq(bankAccounts.identityUserId, user.id))
      .returning()
    return account
  })
