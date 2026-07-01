import { createFileRoute, redirect } from '@tanstack/react-router'
import { getServerUser } from '../lib/auth'
import { getOrCreateAccount } from '../lib/account'
import { doQrisPayment } from '../lib/transactions'
import { BankingLayout } from '../components/BankingLayout'
import { useState, useEffect, useRef } from 'react'
import { QrCode, CheckCircle, AlertCircle, RefreshCw, Scan, Store } from 'lucide-react'

export const Route = createFileRoute('/qris')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/' })
    return { user }
  },
  loader: async () => {
    const account = await getOrCreateAccount()
    return { account }
  },
  component: QrisPage,
})

const MERCHANTS = [
  { name: 'Warung Makan Sederhana', category: 'Makanan & Minuman', code: 'QRIS-WMSD-001' },
  { name: 'Toko Kelontong Makmur', category: 'Belanja', code: 'QRIS-TKM-002' },
  { name: 'Bengkel Motor Jaya', category: 'Otomotif', code: 'QRIS-BMJ-003' },
  { name: 'Apotek Sehat Sejahtera', category: 'Kesehatan', code: 'QRIS-ASS-004' },
  { name: 'Minimarket 24 Jam', category: 'Belanja', code: 'QRIS-MM24-005' },
  { name: 'Kafe Kopi Nusantara', category: 'Makanan & Minuman', code: 'QRIS-KKN-006' },
]

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function QrisCodeDisplay({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 200
    canvas.width = size
    canvas.height = size

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const blockSize = 5
    const cols = Math.floor(size / blockSize)
    const rows = Math.floor(size / blockSize)

    function seededRand(s: number) {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }

    let si = seed
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        si++
        const edge = r < 2 || c < 2 || r >= rows - 2 || c >= cols - 2
        const corner = (r < 8 && c < 8) || (r < 8 && c >= cols - 8) || (r >= rows - 8 && c < 8)
        if (corner) {
          const inSquare = (r >= 1 && r <= 6 && c >= 1 && c <= 6) || (r >= 1 && r <= 6 && c >= cols - 7 && c <= cols - 2) || (r >= rows - 7 && r <= rows - 2 && c >= 1 && c <= 6)
          const innerSquare = (r >= 3 && r <= 4 && c >= 3 && c <= 4) || (r >= 3 && r <= 4 && c >= cols - 5 && c <= cols - 4) || (r >= rows - 5 && r <= rows - 4 && c >= 3 && c <= 4)
          ctx.fillStyle = (inSquare || innerSquare) ? '#000000' : '#ffffff'
        } else if (!edge && seededRand(si) > 0.45) {
          ctx.fillStyle = '#000000'
        } else {
          ctx.fillStyle = '#ffffff'
        }
        ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize)
      }
    }

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    const border = 8
    ctx.strokeRect(border * blockSize, border * blockSize, 6 * blockSize, 6 * blockSize)
    ctx.strokeRect((cols - 14) * blockSize, border * blockSize, 6 * blockSize, 6 * blockSize)
    ctx.strokeRect(border * blockSize, (rows - 14) * blockSize, 6 * blockSize, 6 * blockSize)

    ctx.fillStyle = '#1565C0'
    ctx.font = 'bold 8px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('QRIS', size / 2, size - 3)
  }, [code])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas ref={canvasRef} style={{ borderRadius: 8, display: 'block' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #00BFA5, transparent)',
        animation: 'scan-line 2s linear infinite',
        top: 0,
        opacity: 0.8,
      }} />
    </div>
  )
}

export default function QrisPage() {
  const { account } = Route.useLoaderData()
  const [selectedMerchant, setSelectedMerchant] = useState(MERCHANTS[0])
  const [customMerchant, setCustomMerchant] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [amount, setAmount] = useState('')
  const [scanning, setScanning] = useState(false)
  const [step, setStep] = useState<'select' | 'scan' | 'confirm' | 'result'>('select')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const activeMerchant = useCustom ? { name: customMerchant, category: 'Lainnya', code: `QRIS-CUSTOM-${Date.now()}` } : selectedMerchant

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setStep('confirm')
    }, 2200)
  }

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await doQrisPayment({ data: { merchantName: activeMerchant.name, amount: Number(amount), qrisCode: activeMerchant.code } })
      setResult(res)
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Pembayaran gagal')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('select'); setAmount(''); setResult(null); setError(''); setScanning(false)
  }

  return (
    <BankingLayout>
      <div style={{ padding: '32px 40px', maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Bayar QRIS</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.9rem' }}>Scan kode QR dan bayar ke merchant di seluruh Indonesia</p>
        </div>

        <div style={{ background: 'rgba(17, 34, 64, 0.8)', border: '1px solid rgba(30, 58, 95, 0.6)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Saldo Tersedia</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00BFA5' }}>{formatRupiah(account?.balance ?? 0)}</span>
        </div>

        {step === 'select' && (
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginTop: 0, marginBottom: 16 }}>
              <Store size={16} style={{ display: 'inline', marginRight: 8 }} />
              Pilih Merchant
            </h3>

            {/* Preset merchants */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {MERCHANTS.map(m => (
                <button key={m.code} onClick={() => { setSelectedMerchant(m); setUseCustom(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: !useCustom && selectedMerchant.code === m.code ? 'rgba(0, 191, 165, 0.1)' : 'rgba(10, 22, 40, 0.4)',
                  border: !useCustom && selectedMerchant.code === m.code ? '1px solid rgba(0, 191, 165, 0.4)' : '1px solid rgba(30, 58, 95, 0.5)',
                  borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <div style={{ width: 36, height: 36, background: 'rgba(21, 101, 192, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <QrCode size={18} color="#1565C0" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#4a6080' }}>{m.category} · {m.code}</div>
                  </div>
                  {!useCustom && selectedMerchant.code === m.code && <CheckCircle size={16} color="#00BFA5" style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(30,58,95,0.3)', paddingTop: 16, marginBottom: 20 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8 }}>Atau ketik nama merchant manual:</label>
              <input
                type="text"
                value={customMerchant}
                onChange={(e) => { setCustomMerchant(e.target.value); setUseCustom(!!e.target.value) }}
                placeholder="Nama merchant..."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8 }}>Nominal Pembayaran (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min={1}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {[10000, 25000, 50000, 100000, 200000].map(q => (
                  <button key={q} onClick={() => setAmount(String(q))} style={{
                    background: amount === String(q) ? 'rgba(0, 191, 165, 0.15)' : 'rgba(30, 58, 95, 0.3)',
                    border: amount === String(q) ? '1px solid rgba(0, 191, 165, 0.4)' : '1px solid rgba(30, 58, 95, 0.5)',
                    borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                    color: amount === String(q) ? '#00BFA5' : '#64748b', fontSize: '0.78rem', fontFamily: 'inherit',
                  }}>
                    {formatRupiah(q)}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              disabled={(!useCustom && !selectedMerchant) || (useCustom && !customMerchant) || !amount || Number(amount) <= 0}
              onClick={() => setStep('scan')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Scan size={18} /> Lanjut Scan QR
            </button>
          </div>
        )}

        {step === 'scan' && (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginTop: 0, marginBottom: 8 }}>{activeMerchant.name}</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>{activeMerchant.category} · {activeMerchant.code}</p>

            <div style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              background: 'white', borderRadius: 16, padding: 20, marginBottom: 24,
              boxShadow: '0 0 40px rgba(0, 191, 165, 0.2)',
            }}>
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
                <QrisCodeDisplay code={activeMerchant.code} />
              </div>
              <div style={{ marginTop: 12, color: '#1565C0', fontWeight: 700, fontSize: '0.85rem' }}>
                {formatRupiah(Number(amount))}
              </div>
            </div>

            {scanning ? (
              <div style={{ color: '#00BFA5', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Memverifikasi pembayaran...
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>Klik tombol di bawah untuk mensimulasikan scan QR code</p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setStep('select')}>Kembali</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleScan} disabled={scanning}>
                {scanning ? 'Memproses...' : 'Simulasi Scan'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginTop: 0, marginBottom: 24 }}>Konfirmasi Pembayaran</h2>
            {[
              { label: 'Merchant', value: activeMerchant.name },
              { label: 'Kategori', value: activeMerchant.category },
              { label: 'QRIS Code', value: activeMerchant.code },
              { label: 'Nominal', value: formatRupiah(Number(amount)), bold: true },
              { label: 'Biaya', value: 'Gratis' },
            ].map(({ label, value, bold }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(30,58,95,0.3)' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{label}</span>
                <span style={{ color: bold ? '#00BFA5' : '#e2e8f0', fontWeight: bold ? 700 : 500, fontSize: '0.9rem' }}>{value}</span>
              </div>
            ))}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: 8, color: '#EF5350', fontSize: '0.85rem', marginTop: 16 }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-secondary" onClick={() => setStep('scan')}>Kembali</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handlePay} disabled={loading}>
                {loading ? 'Memproses...' : `Bayar ${formatRupiah(Number(amount))}`}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: 'rgba(0, 191, 165, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#00BFA5" />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', marginTop: 0 }}>Pembayaran Berhasil!</h2>
            <p style={{ color: '#64748b', marginBottom: 8 }}>
              {formatRupiah(Number(amount))} berhasil dibayarkan ke<br />
              <strong style={{ color: '#e2e8f0' }}>{activeMerchant.name}</strong>
            </p>
            <div style={{ background: 'rgba(10, 22, 40, 0.6)', borderRadius: 10, padding: '10px 16px', marginBottom: 24, display: 'inline-block' }}>
              <span style={{ color: '#4a6080', fontSize: '0.8rem' }}>Ref: </span>
              <span style={{ color: '#00BFA5', fontFamily: 'monospace', fontSize: '0.85rem' }}>{result.transaction.referenceId}</span>
            </div>
            <button className="btn-primary" onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={16} /> Bayar Lagi
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </BankingLayout>
  )
}
