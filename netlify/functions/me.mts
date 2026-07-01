import type { Config } from '@netlify/functions'
import { getUser } from '@netlify/identity'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bankAccounts } from '../../db/schema.js'
import { errorResponse, json, serializeUser } from './auth-response.mjs'

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return json({ ok: false, error: 'Method not allowed.' }, 405)
  }

  try {
    const user = await getUser()

    if (!user) {
      return json({ ok: false, user: null }, 401)
    }

    const [account] = await db
      .select({
        id: bankAccounts.id,
        accountNumber: bankAccounts.accountNumber,
        fullName: bankAccounts.fullName,
        email: bankAccounts.email,
        phone: bankAccounts.phone,
        balance: bankAccounts.balance,
        avatarUrl: bankAccounts.avatarUrl,
      })
      .from(bankAccounts)
      .where(eq(bankAccounts.identityUserId, user.id))
      .limit(1)

    return json({
      ok: true,
      user: serializeUser(user),
      account: account ?? null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const config: Config = {
  method: 'GET',
}
