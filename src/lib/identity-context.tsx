import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getUser, logout as browserLogout, onAuthChange, type User } from '@netlify/identity'

interface IdentityContextValue {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch('/.netlify/functions/me', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? getUser() : null))
      .then((u) => {
        setUser(u ?? null)
        setReady(true)
      })
      .catch(() => {
        setUser(null)
        setReady(true)
      })

    const unsubscribe = onAuthChange((_event, u) => {
      setUser(u ?? null)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    const response = await fetch('/.netlify/functions/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      await browserLogout()
    }

    setUser(null)
  }

  return (
    <IdentityContext.Provider value={{ user, ready, logout }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within an IdentityProvider')
  return ctx
}
