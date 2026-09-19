import { ArrowRight, BadgeCheck, BarChart3, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const benefits: Array<[string, string, LucideIcon]> = [
  ['Host-controlled rooms', 'Create a private battle in seconds and share one memorable code.', ShieldCheck],
  ['Live competition pulse', 'Watch registrations and standings update as your room fills.', BarChart3],
  ['Built for every speaker', 'A friendly, focused participant flow that works on any device.', Users],
]

export function LandingPage() {
  return <main>
    <section className="relative overflow-hidden px-6 pb-24 pt-16 text-center">
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-80 max-w-3xl rounded-full bg-violet/15 blur-3xl"/>
      <div className="mx-auto max-w-3xl"><p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-white px-4 py-2 text-xs font-bold text-violet"><Sparkles size={14}/> A better way to practice pronunciation</p>
      <h1 className="text-5xl font-black leading-[1.03] tracking-tight sm:text-7xl">Speak clearly.<br/><span className="text-violet">Compete brilliantly.</span></h1>
      <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-slate-600">A polished, live pronunciation competition for classrooms, clubs, and teams. Hosts stay in control; speakers simply join and shine.</p>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/join" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet px-6 py-3.5 font-bold text-white shadow-glow hover:bg-violet/90">Join a battle <ArrowRight size={18}/></Link><Link to="/host/login" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold hover:border-violet">Host a competition</Link></div></div>
      <div className="mx-auto mt-16 grid max-w-4xl grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div><b className="block text-2xl">1 code</b><span className="text-xs text-slate-500">to enter</span></div><div><b className="block text-2xl">Live</b><span className="text-xs text-slate-500">room updates</span></div><div><b className="block text-2xl">Private</b><span className="text-xs text-slate-500">host console</span></div></div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3">{benefits.map(([title, text, Icon]) => <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-7"><div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-violet/10 text-violet"><Icon size={21}/></div><h2 className="font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></article>)}</section>
    <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500"><BadgeCheck className="mr-1 inline h-4 w-4"/> Secure roles powered by Supabase</footer>
  </main>
}
