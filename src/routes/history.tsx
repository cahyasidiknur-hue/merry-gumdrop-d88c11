import { createFileRoute, redirect } from '@tanstack/react-router'
import { getServerUser } from '../lib/auth'
import { getTransactionHistory } from '../lib/transactions'
import { BankingLayout } from '../components/BankingLayout'
import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  Search,
  Calendar,
  Banknote,
} from 'lucide-react'

export const Route = createFileRoute('/history')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/' })
    return { user }
  },
  loader: async () => {
    const txHistory = await getTransactionHistory()
    return { txHistory }
  },
  component: HistoryPage,
})

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string | Date | null) {
  if (!d) return '-'
  return new Date(d as string).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type FilterType = 'all' | 'transfer' | 'qris' | 'in' | 'out'

export default function HistoryPage() {
  const { txHistory } = Route.useLoaderData()
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = txHistory.filter((tx: any) => {
    if (filter === 'transfer' && tx.type !== 'transfer') return false
    if (filter === 'qris' && tx.type !== 'qris') return false
    if (filter === 'in' && tx.direction !== 'in') return false
    if (filter === 'out' && tx.direction !== 'out') return false
    if (search) {
      const q = search.toLowerCase()
      if (!tx.referenceId.toLowerCase().includes(q) &&
          !(tx.merchantName || '').toLowerCase().includes(q) &&
          !(tx.description || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalIn = txHistory.filter((t: any) => t.direction === 'in').reduce((s: number, t: any) => s + t.amount, 0)
  const totalOut = txHistory.filter((t: any) => t.direction === 'out').reduce((s: number, t: any) => s + t.amount, 0)

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'in', label: 'Masuk' },
    { key: 'out', label: 'Keluar' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'qris', label: 'QRIS' },
  ]

  return (
    <BankingLayout>
      <div style={{ padding: '32px 40px', maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Riwayat Transaksi</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.9rem' }}>Pantau semua aktivitas keuangan Anda</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Transaksi', value: String(txHistory.length), icon: Calendar, color: '#7C3AED' },
            { label: 'Dana Masuk', value: formatRupiah(totalIn), icon: ArrowDownLeft, color: '#00BFA5' },
            { label: 'Dana Keluar', value: formatRupiah(totalOut), icon: ArrowUpRight, color: '#EF5350' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, background: `${color}22`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div style={{ background: 'rgba(17, 34, 64, 0.8)', border: '1px solid rgba(30, 58, 95, 0.6)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a6080' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari referensi, merchant..."
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {filters.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                  background: filter === key ? 'linear-gradient(135deg, #00BFA5, #00897B)' : 'rgba(30, 58, 95, 0.4)',
                  border: filter === key ? 'none' : '1px solid rgba(30, 58, 95, 0.6)',
                  color: filter === key ? 'white' : '#64748b',
                  fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions list */}
        <div style={{ background: 'rgba(17, 34, 64, 0.8)', border: '1px solid rgba(30, 58, 95, 0.6)', borderRadius: 16, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Banknote size={40} color="#1e3a5f" style={{ marginBottom: 12 }} />
              <p style={{ color: '#4a6080' }}>Tidak ada transaksi ditemukan</p>
            </div>
          ) : (
            filtered.map((tx: any) => (
              <div key={tx.id} className="tx-row">
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: tx.type === 'qris' ? 'rgba(124, 58, 237, 0.12)' : tx.direction === 'in' ? 'rgba(0, 191, 165, 0.12)' : 'rgba(239, 83, 80, 0.12)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tx.type === 'qris' ? <QrCode size={20} color="#7C3AED" /> :
                    tx.direction === 'in' ? <ArrowDownLeft size={20} color="#00BFA5" /> : <ArrowUpRight size={20} color="#EF5350" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem', marginBottom: 2 }}>
                    {tx.type === 'qris' ? (tx.merchantName || 'Pembayaran QRIS') :
                      tx.direction === 'in' ? 'Transfer Diterima' : 'Transfer Terkirim'}
                  </div>
                  {tx.description && <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>{tx.description}</div>}
                  <div style={{ fontSize: '0.75rem', color: '#4a6080' }}>{tx.referenceId} · {formatDate(tx.createdAt)}</div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: tx.direction === 'in' ? '#00BFA5' : '#EF5350', marginBottom: 4 }}>
                    {tx.direction === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                  {tx.fee > 0 && <div style={{ fontSize: '0.72rem', color: '#4a6080', marginBottom: 4 }}>+{formatRupiah(tx.fee)} biaya</div>}
                  <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <p style={{ textAlign: 'center', color: '#4a6080', fontSize: '0.8rem', marginTop: 16 }}>
            Menampilkan {filtered.length} dari {txHistory.length} transaksi
          </p>
        )}
      </div>
    </BankingLayout>
  )
}
