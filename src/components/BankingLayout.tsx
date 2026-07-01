import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  ArrowLeftRight,
  QrCode,
  History,
  User,
  LogOut,
  Landmark,
} from 'lucide-react'
import { useIdentity } from '../lib/identity-context'
import { useNavigate } from '@tanstack/react-router'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/qris', label: 'Bayar QRIS', icon: QrCode },
  { to: '/history', label: 'Riwayat', icon: History },
  { to: '/profile', label: 'Profil', icon: User },
]

export function BankingLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useIdentity()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a1628' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: 'rgba(17, 34, 64, 0.95)',
        borderRight: '1px solid rgba(30, 58, 95, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 24px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(30, 58, 95, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #00BFA5, #1565C0)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Landmark size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.3px' }}>SIDIK<span style={{ color: '#00BFA5' }}>Bank</span></div>
              <div style={{ fontSize: '0.7rem', color: '#4a6080', letterSpacing: '0.5px' }}>DIGITAL BANKING</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link${currentPath === to || currentPath.startsWith(to + '/') ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(30, 58, 95, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #1565C0, #00BFA5)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: 'white',
            }}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#4a6080', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link" style={{ color: '#EF5350', width: '100%' }}>
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 260, flex: 1, minHeight: '100vh', background: '#0a1628' }}>
        {children}
      </main>
    </div>
  )
}
