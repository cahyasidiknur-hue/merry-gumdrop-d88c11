import { createFileRoute, redirect } from '@tanstack/react-router'
import { getServerUser } from '../lib/auth'
import { getOrCreateAccount } from '../lib/account'
import { doTransfer } from '../lib/transactions'
import { BankingLayout } from '../components/BankingLayout'
import { useState } from 'react'
import {
  Search,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Banknote,
  FileText,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react'

export const Route = createFileRoute('/transfer')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/' })
    return { user }
  },
  loader: async () => {
    const account = await getOrCreateAccount()
    return { account }
  },
  component: TransferPage,
})

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const firstNames = ['BUDI', 'ANDI', 'SITI', 'RINA', 'DEWI', 'ADI', 'FAJAR', 'NINA', 'AGUS', 'YUNI', 'RIO', 'DIAN']
const lastNames = ['SANTOSO', 'SAPUTRA', 'PRATAMA', 'MAHARANI', 'SETIAWAN', 'WIJAYA', 'HIDAYAT', 'PERMANA', 'NUGROHO', 'KUSUMA', 'PANGESTU', 'LESTARI']

function generateDemoAccountName(accountNumber: string) {
  let hash = 0
  for (const c of accountNumber) hash += c.charCodeAt(0)
  return `${firstNames[hash % firstNames.length]} ${lastNames[(hash * 7) % lastNames.length]}`
}

export default function TransferPage() {
  const { account } = Route.useLoaderData()

  const [toNumber, setToNumber] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [lookupError, setLookupError] = useState('')
const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const [transferType, setTransferType] = useState<'internal' | 'interbank'>('internal')
  const [bankCode, setBankCode] = useState('BCA')
  const [method, setMethod] = useState<'bifast' | 'rtol'>('bifast')

  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2000000]
  const fee = transferType === 'internal' ? 0 : method === 'bifast' ? 2500 : 6500

  const handleLookup = () => {
    if (toNumber.length < 10) return
    setResolvedName(generateDemoAccountName(toNumber))
    setLookupError('')
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await doTransfer({ data: { toAccountNumber: toNumber, amount: Number(amount), description, transferType, bankCode, method } })
      setResult(res)
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Transfer gagal')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setToNumber(''); setResolvedName(''); setAmount(''); setDescription('')
    setTransferType('internal'); setBankCode('BCA'); setMethod('bifast')
    setStep('form'); setResult(null); setError(''); setLookupError('')
  }

  return (
    <BankingLayout>
      <div style={{ padding: '32px 40px', maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Transfer Dana</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.9rem' }}>Kirim uang ke rekening SIDIKBank manapun secara real-time</p>
        </div>

        {/* Saldo info */}
        <div style={{ background: 'rgba(17, 34, 64, 0.8)', border: '1px solid rgba(30, 58, 95, 0.6)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Saldo Tersedia</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00BFA5' }}>{formatRupiah(account?.balance ?? 0)}</span>
        </div>

        {step === 'form' && (
          <div className="glass-card" style={{ padding: 32 }}>
            {/* Recipient */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                <User size={14} style={{ display: 'inline', marginRight: 6 }} />
                Nomor Rekening Tujuan
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={toNumber}
                  onChange={(e) => { setToNumber(e.target.value); setResolvedName(''); setLookupError('') }}
                  placeholder="Masukkan nomor rekening"
                  maxLength={11}
                  style={{ flex: 1 }}
                />
                {transferType === 'internal' && (
                  <button
                    onClick={handleLookup}
                    disabled={toNumber.length < 10}
                    style={{
                      background: 'rgba(0, 191, 165, 0.15)', border: '1px solid rgba(0, 191, 165, 0.3)',
                      borderRadius: 10, padding: '0 16px', cursor: 'pointer', color: '#00BFA5',
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      opacity: toNumber.length < 10 ? 0.5 : 1,
                    }}
                  >
                    <Search size={16} />
                    Cek
                  </button>
                )}
              </div>
              {resolvedName && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#00BFA5', fontSize: '0.85rem' }}>
                  <CheckCircle size={14} />
                  <span>{resolvedName}</span>
                </div>
              )}
              {lookupError && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#EF5350', fontSize: '0.85rem' }}>
                  <AlertCircle size={14} />
                  {lookupError}
                </div>
              )}
            </div>

            {/* Transfer type */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 10, fontWeight: 500 }}>
                <Building2 size={14} style={{ display: 'inline', marginRight: 6 }} />
                Jenis Transfer
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['internal', 'interbank'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setTransferType(type); setResolvedName(''); setLookupError('') }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                      background: transferType === type ? 'rgba(0, 191, 165, 0.15)' : 'rgba(30, 58, 95, 0.3)',
                      border: transferType === type ? '1px solid rgba(0, 191, 165, 0.5)' : '1px solid rgba(30, 58, 95, 0.5)',
                      color: transferType === type ? '#00BFA5' : '#64748b',
                    }}
                  >
                    {type === 'internal' ? 'Sesama Bank' : 'Antar Bank'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interbank options */}
            {transferType === 'interbank' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 500 }}>Bank Tujuan</label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="MANDIRI">Bank Mandiri</option>
                    <option value="CIMB">Bank CIMB</option>
                    <option value="PERMATA">Bank Permata</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 500 }}>Metode Transfer</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {([['bifast', 'BI-FAST', 2500], ['rtol', 'Real Time Online', 6500]] as const).map(([val, label, methodFee]) => (
                      <button
                        key={val}
                        onClick={() => setMethod(val)}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                          textAlign: 'center', transition: 'all 0.15s',
                          background: method === val ? 'rgba(0, 191, 165, 0.12)' : 'rgba(30, 58, 95, 0.3)',
                          border: method === val ? '1px solid rgba(0, 191, 165, 0.4)' : '1px solid rgba(30, 58, 95, 0.5)',
                          color: method === val ? '#00BFA5' : '#64748b',
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: 2, opacity: 0.8 }}>{formatRupiah(methodFee)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                <Banknote size={14} style={{ display: 'inline', marginRight: 6 }} />
                Nominal Transfer
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min={1}
                max={account?.balance}
              />
              {/* Quick amounts */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {quickAmounts.map(q => (
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

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                <FileText size={14} style={{ display: 'inline', marginRight: 6 }} />
                Berita (Opsional)
              </label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Untuk keperluan apa?" />
            </div>

            {/* Fee info */}
            {amount && (
              <div style={{ background: 'rgba(10, 22, 40, 0.6)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Nominal</span>
                  <span style={{ color: '#e2e8f0' }}>{formatRupiah(Number(amount))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Biaya Admin</span>
                  <span style={{ color: fee === 0 ? '#00BFA5' : '#e2e8f0' }}>{fee === 0 ? 'Gratis' : formatRupiah(fee)}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(30,58,95,0.4)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Total Debit</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{formatRupiah(Number(amount) + fee)}</span>
                </div>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: 8, color: '#EF5350', fontSize: '0.85rem', marginBottom: 16 }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              disabled={!toNumber || !amount || Number(amount) <= 0 || (transferType === 'internal' && !resolvedName)}
              onClick={() => { setStep('confirm'); setError('') }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Lanjutkan <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginTop: 0, marginBottom: 24 }}>Konfirmasi Transfer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Dari Rekening', value: account?.accountNumber },
                { label: 'Ke Rekening', value: transferType === 'internal' ? `${toNumber} — ${resolvedName}` : toNumber },
                ...(transferType === 'interbank' ? [
                  { label: 'Bank Tujuan', value: bankCode },
                  { label: 'Metode', value: method === 'bifast' ? 'BI-FAST' : 'Real Time Online' },
                ] : []),
                { label: 'Jenis Transfer', value: transferType === 'internal' ? 'Sesama Bank' : 'Antar Bank' },
                { label: 'Nominal', value: formatRupiah(Number(amount)) },
                { label: 'Biaya Admin', value: fee === 0 ? 'Gratis' : formatRupiah(fee) },
                { label: 'Total Debit', value: formatRupiah(Number(amount) + fee), bold: true },
                { label: 'Berita', value: description || '(tidak ada)' },
              ].map(({ label, value, bold }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(30,58,95,0.3)' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{label}</span>
                  <span style={{ color: bold ? '#00BFA5' : '#e2e8f0', fontWeight: bold ? 700 : 500, fontSize: '0.9rem' }}>{value}</span>
                </div>
              ))}
            </div>

            {Number(amount) >= 5000000 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 8, marginBottom: 20 }}>
                <AlertTriangle size={16} color="#FFD700" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#FFD700', fontSize: '0.82rem' }}>Nominal besar. Pastikan rekening tujuan sudah benar sebelum melanjutkan.</span>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: 8, color: '#EF5350', fontSize: '0.85rem', marginBottom: 16 }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setStep('form')} style={{ flex: 1 }}>Kembali</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleConfirm} disabled={loading}>
                {loading ? 'Memproses...' : 'Kirim Sekarang'}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            {result.transaction.status === 'success' ? (
              <>
                <div style={{ width: 72, height: 72, background: 'rgba(0, 191, 165, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={36} color="#00BFA5" />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', marginTop: 0 }}>Transfer Berhasil!</h2>
                <p style={{ color: '#64748b', marginBottom: 8 }}>
                  {formatRupiah(Number(amount))} berhasil dikirim ke<br />
                  <strong style={{ color: '#e2e8f0' }}>{result.toAccount.fullName}</strong>
                </p>
                <div style={{ background: 'rgba(10, 22, 40, 0.6)', borderRadius: 10, padding: '10px 16px', marginBottom: 24, display: 'inline-block' }}>
                  <span style={{ color: '#4a6080', fontSize: '0.8rem' }}>Ref: </span>
                  <span style={{ color: '#00BFA5', fontFamily: 'monospace', fontSize: '0.85rem' }}>{result.transaction.referenceId}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 72, height: 72, background: 'rgba(255, 215, 0, 0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <AlertTriangle size={36} color="#FFD700" />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', marginTop: 0 }}>Transfer Ditahan</h2>
                <p style={{ color: '#64748b', marginBottom: 8 }}>Transaksi ini ditandai oleh sistem keamanan kami dan memerlukan verifikasi tambahan.</p>
                {result.fraud && (
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, padding: '12px', marginBottom: 20, fontSize: '0.85rem', color: '#FFD700' }}>
                    Alasan: {result.fraud.reason}
                  </div>
                )}
              </>
            )}
            <button className="btn-primary" onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={16} /> Transfer Lagi
            </button>
          </div>
        )}
      </div>
    </BankingLayout>
  )
}
