import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = { session: Session | null; isHost: boolean; loading: boolean }
const AuthContext = createContext<AuthState>({ session: null, isHost: false, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, isHost: false, loading: true })

  useEffect(() => {
    if (!supabase) { setState({ session: null, isHost: false, loading: false }); return }
    const load = async (session: Session | null) => {
      if (!session) return setState({ session: null, isHost: false, loading: false })
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      setState({ session, isHost: data?.role === 'host', loading: false })
    }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => load(session))
    return () => listener.subscription.unsubscribe()
  }, [])
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
