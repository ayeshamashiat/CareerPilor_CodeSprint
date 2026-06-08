import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import {
  LayoutDashboard, MessageSquare, Briefcase, FileText,
  Target, Mic, Upload, LogOut, User, BarChart2,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Profile',        icon: User,            to: '/profile' },
  { label: 'AI Assistant',   icon: MessageSquare,   to: '/chat' },
  { label: 'Job Hunter',     icon: Briefcase,       to: '/jobs' },
  { label: 'Fit Score',      icon: Target,          to: '/fit-score' },
  { label: 'Upload CV',      icon: Upload,          to: '/cv-upload' },
  { label: 'Tailor CV',      icon: FileText,        to: '/tailor-cv' },
  { label: 'Interview Coach',icon: Mic,             to: '/interview' },
  { label: 'Tracker',        icon: BarChart2,       to: '/tracker' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const logout    = useAuthStore((s) => s.logout)
  const user      = useAuthStore((s) => s.user)

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="w-58 shrink-0 flex flex-col border-r border-white/5"
        style={{
          width: '232px',
          background: 'linear-gradient(160deg, #0f0a1e 0%, #0d0d17 60%, #0a0a14 100%)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">CareerPilot</p>
              <p className="text-[10px] text-violet-400/70 leading-none mt-0.5">AI-powered career OS</p>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <p className="px-5 text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
          Navigation
        </p>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className="relative flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] transition-all duration-200 group"
                style={active ? {
                  background: 'linear-gradient(90deg, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.06) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.25)',
                } : {}}
              >
                {/* Active left bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-500"
                    style={{ boxShadow: '0 0 8px rgba(139,92,246,0.9)' }}
                  />
                )}

                {/* Icon */}
                <span className={`transition-all duration-200 ${
                  active ? 'text-violet-400' : 'text-gray-500 group-hover:text-violet-400'
                }`}>
                  <Icon size={16} />
                </span>

                {/* Label */}
                <span className={`transition-all duration-200 ${
                  active ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                }`}>
                  {label}
                </span>

                {/* Hover glow */}
                {!active && (
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.08) 0%, transparent 100%)' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 mt-2">
          <div className="h-px bg-white/5 mb-3 mx-1" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-[13px] text-gray-500
              hover:text-red-400 transition-all duration-200 group"
            style={{ background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div
          className="px-6 py-3 border-b border-white/5 flex items-center justify-end shrink-0"
          style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-violet-300"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 10px rgba(139,92,246,0.2)',
            }}
          >
            {initials}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}