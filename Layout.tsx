import { Link, NavLink } from 'react-router-dom'
import { LogOut, Mic2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, isHost } = useAuth()
  return <div className="min-h-screen bg-pearl text-ink">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet text-white"><Mic2 size={19}/></span>Pronunciation Battle</Link>
      <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
        <NavLink to="/join" className="hover:text-violet">Join a battle</NavLink>
        {isHost && <NavLink to="/host" className="hover:text-violet">Host dashboard</NavLink>}
        {session ? <button onClick={() => supabase?.auth.signOut()} className="inline-flex items-center gap-2 hover:text-violet"><LogOut size={16}/>Sign out</button> : <Link to="/host/login" className="rounded-xl bg-ink px-4 py-2 text-white hover:bg-violet">Host sign in</Link>}
      </nav>
    </header>
    {children}
  </div>
}
