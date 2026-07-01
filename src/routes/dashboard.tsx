import { createFileRoute, redirect } from '@tanstack/react-router'
import { getServerUser } from '../lib/auth'
import { getOrCreateAccount } from '../lib/account'
import { getTransactionHistory } from '../lib/transactions'
import { BankingLayout } from '../components/BankingLayout'
import { useEffect, useState } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  TrendingUp,
  Copy,
  CheckCheck,
  ArrowLeftRight,
  Server,
  Database,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/' })
    return { user }
  },
  loader: async () => {
    const [account, txHistory] = await Promise.all([
      getOrCreateAccount(),
      getTransactionHistory(),
    ])
    return { account, txHistory }
  },
  component: DashboardPage,
})

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(d: string | Date | null) {
  if (!d) return '-'
  return new Date(d as string).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type BankingStatus = {
  ok: boolean
  database: string
  accounts: number
  transactions: number
}

export default function DashboardPage() {
  const { account, txHistory } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [bankingStatus, setBankingStatus] = useState<BankingStatus | null>(null)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    let cancelled = false

    fetch('/api/banking-status')
      .then((response) => response.json() as Promise<BankingStatus>)
      .then((status) => {
        if (!cancelled) setBankingStatus(status)
      })
      .catch(() => {
        if (!cancelled) {
          setBankingStatus({
            ok: false,
            database: 'unavailable',
            accounts: 0,
            transactions: 0,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const copyAccount = () => {
    navigator.clipboard.writeText(account?.accountNumber || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const recent = txHistory.slice(0, 5)
  const totalIn = txHistory.filter((t: any) => t.direction === 'in').reduce((s: number, t: any) => s + t.amount, 0)
  const totalOut = txHistory.filter((t: any) => t.direction === 'out').reduce((s: number, t: any) => s + t.amount + t.fee, 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam'

  return (
    <BankingLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: '#64748b', marginBottom: 4, fontSize: '0.9rem' }}>{greeting},</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            {account?.fullName || user?.name || 'Pengguna'}
          </h1>
        </div>

        {/* Balance Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0d2a5c 50%, #00897B 100%)',
          borderRadius: 20,
          padding: '36px 40px',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -40, width: 240, height: 240,
            background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, right: 80, width: 180, height: 180,
            background: 'rgba(255,255,255,0.04)', borderRadius: '50%',
          }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: 6 }}>Saldo Rekening</p>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
                  {mounted ? formatRupiah(account?.balance ?? 0) : '•••••••'}
                </div>
              </div>
              <div style={{
                width: 52, height: 52,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wallet size={26} color="white" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>No. Rekening</span>
                <span style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '1px' }}>
                  {account?.accountNumber}
                </span>
              </div>
              <button
                onClick={copyAccount}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
              >
                {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { to: '/transfer', icon: ArrowLeftRight, label: 'Transfer', color: '#1565C0' },
            { to: '/qris', icon: QrCode, label: 'Bayar QRIS', color: '#00897B' },
            { to: '/history', icon: TrendingUp, label: 'Riwayat', color: '#7C3AED' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(17, 34, 64, 0.8)',
                border: '1px solid rgba(30, 58, 95, 0.6)',
                borderRadius: 14,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <div style={{ width: 48, height: 48, background: `${color}22`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={color} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(0, 191, 165, 0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownLeft size={18} color="#00BFA5" />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Masuk</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00BFA5' }}>{mounted ? formatRupiah(totalIn) : '...'}</div>
            <div style={{ fontSize: '0.75rem', color: '#4a6080', marginTop: 4 }}>{txHistory.filter((t: any) => t.direction === 'in').length} transaksi</div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(239, 83, 80, 0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={18} color="#EF5350" />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Keluar</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#EF5350' }}>{mounted ? formatRupiah(totalOut) : '...'}</div>
            <div style={{ fontSize: '0.75rem', color: '#4a6080', marginTop: 4 }}>{txHistory.filter((t: any) => t.direction === 'out').length} transaksi</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(17, 34, 64, 0.8)',
          border: '1px solid rgba(30, 58, 95, 0.6)',
          borderRadius: 16,
          padding: '18px 20px',
          marginBottom: 28,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) repeat(3, minmax(120px, 1fr))',
          gap: 14,
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, background: 'rgba(21, 101, 192, 0.16)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Server size={20} color="#60a5fa" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700 }}>React → Netlify Function → Postgres</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 3 }}>Status koneksi simulator</div>
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: 4 }}>Function</div>
            <div style={{ color: bankingStatus?.ok ? '#00BFA5' : '#94a3b8', fontWeight: 700, fontSize: '0.9rem' }}>
              {bankingStatus ? (bankingStatus.ok ? 'Online' : 'Error') : 'Memuat'}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: 4 }}>Database</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: bankingStatus?.ok ? '#00BFA5' : '#94a3b8', fontWeight: 700, fontSize: '0.9rem' }}>
              <Database size={15} />
              {bankingStatus?.database ?? 'checking'}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: 4 }}>Records</div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
              {bankingStatus ? `${bankingStatus.accounts} akun · ${bankingStatus.transactions} tx` : '...'}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div style={{ background: 'rgba(17, 34, 64, 0.8)', border: '1px solid rgba(30, 58, 95, 0.6)', borderRadius: 16 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30, 58, 95, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>Transaksi Terakhir</h3>
            <Link to="/history" style={{ fontSize: '0.8rem', color: '#00BFA5', textDecoration: 'none' }}>Lihat semua →</Link>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#4a6080' }}>Belum ada transaksi</div>
          ) : (
            recent.map((tx: any) => (
              <div key={tx.id} className="tx-row">
                <div style={{
                  width: 40, height: 40,
                  background: tx.direction === 'in' ? 'rgba(0, 191, 165, 0.12)' : 'rgba(239, 83, 80, 0.12)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {tx.type === 'qris' ? <QrCode size={18} color="#7C3AED" /> :
                    tx.direction === 'in' ? <ArrowDownLeft size={18} color="#00BFA5" /> : <ArrowUpRight size={18} color="#EF5350" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>
                    {tx.type === 'qris' ? (tx.merchantName || 'Pembayaran QRIS') : tx.direction === 'in' ? 'Transfer Masuk' : 'Transfer Keluar'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4a6080' }}>{tx.referenceId} · {formatDate(tx.createdAt)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: tx.direction === 'in' ? '#00BFA5' : '#EF5350', fontSize: '0.95rem' }}>
                    {tx.direction === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                  <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </BankingLayout>
  )
}
