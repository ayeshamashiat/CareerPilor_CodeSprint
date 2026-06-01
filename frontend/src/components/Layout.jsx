import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import {
  LayoutDashboard, MessageSquare, Briefcase,
  FileText, Target, Mic, Send, Zap, Upload, LogOut
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'AI Assistant', icon: MessageSquare, to: '/chat' },
  { label: 'Job Hunter', icon: Briefcase, to: '/jobs' },
  { label: 'Fit Score', icon: Target, to: '/fit-score' },
  { label: 'Upload CV', icon: Upload, to: '/cv-upload' },
  { label: 'Tailor CV', icon: FileText, to: '/tailor-cv' },
  { label: 'Interview Coach', icon: Mic, to: '/interview' },
  { label: 'Outreach', icon: Send, to: '/outreach' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-52 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
        <div className="px-4 pb-4 border-b border-gray-800 mb-2">
          <p className="text-sm font-semibold text-white">CareerPilot</p>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered career OS</p>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {NAV.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-gray-800 text-white border-l-2 border-violet-500 pl-[10px]'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 mt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm px-3 py-2 w-full rounded-lg hover:bg-gray-800 transition"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-end shrink-0">
          <div className="w-8 h-8 rounded-full bg-violet-900 border border-violet-700 flex items-center justify-center text-xs font-semibold text-violet-300">
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