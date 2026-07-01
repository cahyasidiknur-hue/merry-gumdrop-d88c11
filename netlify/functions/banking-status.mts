import type { Config } from '@netlify/functions'
import { count } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { bankAccounts, transactions } from '../../db/schema.js'

export default async () => {
  try {
    const [accountRows, transactionRows] = await Promise.all([
      db.select({ value: count() }).from(bankAccounts),
      db.select({ value: count() }).from(transactions),
    ])

    return Response.json({
      ok: true,
      database: 'connected',
      accounts: accountRows[0]?.value ?? 0,
      transactions: transactionRows[0]?.value ?? 0,
    })
  } catch {
    return Response.json(
      {
        ok: false,
        database: 'unavailable',
        accounts: 0,
        transactions: 0,
      },
      { status: 503 },
    )
  }
}

export const config: Config = {
  path: '/api/banking-status',
  method: 'GET',
}
