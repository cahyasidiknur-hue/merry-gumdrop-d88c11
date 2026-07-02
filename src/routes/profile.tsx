import { createFileRoute, redirect } from '@tanstack/react-router'
import { getServerUser } from '../lib/auth'
import { getOrCreateAccount, updateProfile } from '../lib/account'
import { BankingLayout } from '../components/BankingLayout'
import { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Shield,
  Edit3,
} from 'lucide-react'

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/' })
    return { user }
  },
  loader: async () => {
    const account = await getOrCreateAccount()
    return { account }
  },
  component: ProfilePage,
})

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string | Date | null) {
  if (!d) return '-'
  return new Date(d as string).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const { account } = Route.useLoaderData()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(account?.fullName || '')
  const [phone, setPhone] = useState(account?.phone || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await updateProfile({ data: { fullName, phone } })
      setSuccess('Profil berhasil diperbarui!')
      setEditing(false)
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  const initials = (fullName || 'U')[0].toUpperCase()
  const accountLevel = (account?.balance ?? 0) >= 10000000 ? 'Gold' : (account?.balance ?? 0) >= 1000000 ? 'Silver' : 'Basic'
  const levelColor = accountLevel === 'Gold' ? '#FFD700' : accountLevel === 'Silver' ? '#94a3b8' : '#00BFA5'

  return (
    <BankingLayout>
      <div style={{ padding: '32px 40px', maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Profil Saya</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.9rem' }}>Kelola informasi akun dan preferensi Anda</p>
        </div>

        {/* Profile header card */}
        <div style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0d2a5c 60%, #00897B 100%)',
          borderRadius: 20, padding: '36px',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200,
            background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
          }} />

          {/* Avatar */}
          <div style={{
            width: 88, height: 88, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: 'white',
            border: '3px solid rgba(255,255,255,0.3)',
          }}>
            {initials}
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>{account?.fullName || 'Pengguna'}</h2>
              <span style={{ background: `${levelColor}22`, border: `1px solid ${levelColor}44`, color: levelColor, borderRadius: 999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                {accountLevel}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: 4 }}>{account?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>No. Rekening:</span>
              <span style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: '1px' }}>{account?.accountNumber}</span>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>Saldo</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00BFA5' }}>{formatRupiah(account?.balance ?? 0)}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>Bergabung Sejak</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>{formatDate(account?.createdAt ?? null)}</div>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              <User size={16} style={{ display: 'inline', marginRight: 8 }} />
              Informasi Pribadi
            </h3>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0, 191, 165, 0.1)', border: '1px solid rgba(0, 191, 165, 0.3)',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#00BFA5', fontSize: '0.82rem', fontFamily: 'inherit',
              }}>
                <Edit3 size={14} /> Edit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <User size={13} /> Nama Lengkap
              </label>
              {editing ? (
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(10, 22, 40, 0.4)', borderRadius: 10, color: '#e2e8f0', fontSize: '0.95rem' }}>{account?.fullName || '-'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Mail size={13} /> Email
              </label>
              <div style={{ padding: '12px 16px', background: 'rgba(10, 22, 40, 0.4)', borderRadius: 10, color: '#64748b', fontSize: '0.95rem' }}>
                {account?.email} <span style={{ fontSize: '0.75rem', color: '#4a6080' }}>(tidak dapat diubah)</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Phone size={13} /> Nomor Telepon
              </label>
              {editing ? (
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(10, 22, 40, 0.4)', borderRadius: 10, color: '#e2e8f0', fontSize: '0.95rem' }}>{account?.phone || '-'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CreditCard size={13} /> Nomor Rekening
              </label>
              <div style={{ padding: '12px 16px', background: 'rgba(10, 22, 40, 0.4)', borderRadius: 10, color: '#e2e8f0', fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px' }}>{account?.accountNumber}</div>
            </div>
          </div>

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(0, 191, 165, 0.1)', border: '1px solid rgba(0, 191, 165, 0.3)', borderRadius: 8, color: '#00BFA5', fontSize: '0.85rem', marginTop: 20 }}>
              <CheckCircle size={15} />
              {success}
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: 8, color: '#EF5350', fontSize: '0.85rem', marginTop: 20 }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {editing && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => { setEditing(false); setFullName(account?.fullName || ''); setPhone(account?.phone || '') }}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          )}
        </div>

        {/* Security section */}
        <div className="glass-card" style={{ padding: 28, marginTop: 16 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
            <Shield size={16} style={{ display: 'inline', marginRight: 8 }} />
            Keamanan Akun
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Autentikasi Email', status: 'Aktif', ok: true },
              { label: 'Deteksi Penipuan', status: 'Diaktifkan', ok: true },
              { label: 'Audit Log', status: 'Berjalan', ok: true },
              { label: 'Two-Factor Auth', status: 'Tidak Aktif', ok: false },
            ].map(({ label, status, ok }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{label}</span>
                <span className={`badge badge-${ok ? 'success' : 'pending'}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BankingLayout>
  )
}
