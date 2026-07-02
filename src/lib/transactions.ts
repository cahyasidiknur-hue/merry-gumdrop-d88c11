import { createServerFn } from '@tanstack/react-start'
import { db } from '../../db/index.js'
import {
  bankAccounts,
  transactions,
  auditLogs,
  fraudAlerts,
} from '../../db/schema.js'
import { requireAuthMiddleware } from '../middleware/identity.js'
import { eq, desc, or } from 'drizzle-orm'
import { randomUUID } from 'crypto'

function detectFraud(amount: number, balance: number): { flagged: boolean; reason: string; severity: 'low' | 'medium' | 'high' } | null {
  if (amount > balance * 0.9) {
    return { flagged: true, reason: 'Transfer melebihi 90% saldo tersedia', severity: 'high' }
  }
  if (amount > 10000000) {
    return { flagged: true, reason: 'Nominal transfer di atas batas normal (Rp 10 juta)', severity: 'medium' }
  }
  if (amount > 5000000) {
    return { flagged: true, reason: 'Nominal transfer cukup besar, dimonitor', severity: 'low' }
  }
  return null
}

export const doTransfer = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((data: {
    toAccountNumber: string
    amount: number
    description: string
    transferType: 'internal' | 'interbank'
    bankCode: string
    method: 'bifast' | 'rtol'
  }) => data)
  .handler(async ({ context, data }) => {
    const { user } = context

    const [fromAccount] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.identityUserId, user.id))
      .limit(1)

    if (!fromAccount) throw new Error('Akun pengirim tidak ditemukan')
    if (data.amount <= 0) throw new Error('Nominal harus lebih dari 0')

    let toAccount: typeof bankAccounts.$inferSelect | null = null
    if (data.transferType === 'internal') {
      const [found] = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.accountNumber, data.toAccountNumber))
        .limit(1)
      if (!found) throw new Error('Nomor rekening tujuan tidak ditemukan')
      if (fromAccount.id === found.id) throw new Error('Tidak dapat transfer ke rekening sendiri')
      toAccount = found
    }

    if (data.amount > fromAccount.balance) throw new Error('Saldo tidak mencukupi')

    const fee = data.transferType === 'internal' ? 0 : data.method === 'bifast' ? 2500 : 6500
    const totalDeduction = data.amount + fee

    if (totalDeduction > fromAccount.balance) throw new Error('Saldo tidak mencukupi termasuk biaya transfer')

    const fraud = detectFraud(data.amount, fromAccount.balance)
    const refId = `TRX${Date.now()}`

    const [tx] = await db.insert(transactions).values({
      referenceId: refId,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount?.id ?? null,
      type: 'transfer',
      status: fraud?.severity === 'high' ? 'flagged' : 'success',
      amount: data.amount,
      description: data.description,
      fee,
      transferType: data.transferType,
      bankCode: data.transferType === 'interbank' ? data.bankCode : '',
      method: data.transferType === 'interbank' ? data.method : 'bifast',
    }).returning()

    if (tx.status === 'success') {
      await db.update(bankAccounts).set({ balance: fromAccount.balance - totalDeduction, updatedAt: new Date() }).where(eq(bankAccounts.id, fromAccount.id))
      if (toAccount) {
        await db.update(bankAccounts).set({ balance: toAccount.balance + data.amount, updatedAt: new Date() }).where(eq(bankAccounts.id, toAccount.id))
      }
    }

    await db.insert(auditLogs).values({
      accountId: fromAccount.id,
      action: 'transfer',
      detail: `Transfer ${data.amount} ke ${data.toAccountNumber} (${data.transferType}) - ${tx.status}`,
    })

    if (fraud) {
      await db.insert(fraudAlerts).values({
        transactionId: tx.id,
        accountId: fromAccount.id,
        severity: fraud.severity,
        reason: fraud.reason,
      })
    }

    return {
      transaction: tx,
      toAccount: toAccount
        ? { fullName: toAccount.fullName, accountNumber: toAccount.accountNumber }
        : { fullName: data.toAccountNumber, accountNumber: data.toAccountNumber },
      fraud,
    }
  })

export const doQrisPayment = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((data: { merchantName: string; amount: number; qrisCode: string }) => data)
  .handler(async ({ context, data }) => {
    const { user } = context

    const [fromAccount] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.identityUserId, user.id))
      .limit(1)

    if (!fromAccount) throw new Error('Akun tidak ditemukan')
    if (data.amount <= 0) throw new Error('Nominal harus lebih dari 0')
    if (data.amount > fromAccount.balance) throw new Error('Saldo tidak mencukupi')

    const refId = `QR-${randomUUID().substring(0, 8).toUpperCase()}`

    const [tx] = await db.insert(transactions).values({
      referenceId: refId,
      fromAccountId: fromAccount.id,
      type: 'qris',
      status: 'success',
      amount: data.amount,
      merchantName: data.merchantName,
      qrisCode: data.qrisCode,
      fee: 0,
    }).returning()

    await db.update(bankAccounts).set({ balance: fromAccount.balance - data.amount, updatedAt: new Date() }).where(eq(bankAccounts.id, fromAccount.id))

    await db.insert(auditLogs).values({
      accountId: fromAccount.id,
      action: 'qris_payment',
      detail: `QRIS ${data.amount} ke ${data.merchantName}`,
    })

    return { transaction: tx }
  })

export const getTransactionHistory = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const { user } = context

    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.identityUserId, user.id))
      .limit(1)

    if (!account) return []

    const txs = await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.fromAccountId, account.id), eq(transactions.toAccountId, account.id)))
      .orderBy(desc(transactions.createdAt))
      .limit(50)

    return txs.map((tx) => ({
      ...tx,
      direction: tx.fromAccountId === account.id ? 'out' : 'in',
    }))
  })

export const lookupAccount = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((data: { accountNumber: string }) => data)
  .handler(async ({ data }) => {
    const [account] = await db
      .select({ fullName: bankAccounts.fullName, accountNumber: bankAccounts.accountNumber })
      .from(bankAccounts)
      .where(eq(bankAccounts.accountNumber, data.accountNumber))
      .limit(1)

    return account ?? null
  })
