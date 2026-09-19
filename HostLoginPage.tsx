import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function HostLoginPage() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const { session, isHost } = useAuth(); const navigate = useNavigate()
  if (session && isHost) return <Navigate to="/host" replace />
  const signIn = async (e: React.FormEvent) => { e.preventDefault(); if (!supabase) return; setBusy(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (error) setError(error.message); else navigate('/host') }
  return <main className="mx-auto max-w-md px-6 py-16"><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-7 grid h-12 w-12 place-items-center rounded-xl bg-violet text-white"><KeyRound/></div><h1 className="text-2xl font-black">Host sign in</h1><p className="mt-2 text-sm text-slate-600">Your competition controls are private to verified host accounts.</p>{!isSupabaseConfigured && <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Add your Supabase keys to <code>.env</code> to enable sign-in.</p>}<form className="mt-7 space-y-4" onSubmit={signIn}><label className="block text-sm font-bold">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet" placeholder="host@example.com"/></label><label className="block text-sm font-bold">Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet"/></label>{error && <p className="text-sm text-rose-600">{error}</p>}<button disabled={busy || !isSupabaseConfigured} className="w-full rounded-xl bg-ink py-3 font-bold text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in securely'}</button></form></div></main>
}
