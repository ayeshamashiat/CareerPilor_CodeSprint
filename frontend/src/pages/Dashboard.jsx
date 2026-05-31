import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  FileText,
  Target,
  Mic,
  Send,
  TrendingUp,
  Flame,
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
  Zap,
} from 'lucide-react'

// ─── mock data (replace with real API calls as you build out the backend) ───
const MOCK_STATS = {
  applications: { value: 5, sub: '+3 this week' },
  skills: { value: 2, sub: 'Docker, Redis' },
  roadmap: { value: '34%', sub: 'Week 3 of 12' },
  streak: { value: 7, sub: 'Keep it up! 🔥' },
}

const MOCK_ROADMAP = [
  { week: 'Week 1–2', task: 'SQL advanced queries + indexing', status: 'done' },
  { week: 'Week 3–4', task: 'Docker + containerisation basics', status: 'active' },
  { week: 'Week 5–6', task: 'Intro to ML with scikit-learn', status: 'todo' },
  { week: 'Week 7–8', task: 'Apache Kafka fundamentals', status: 'todo' },
  { week: 'Week 9–12', task: 'Capstone: end-to-end ML pipeline', status: 'todo' },
]

const MOCK_KANBAN = {
  Applied: [
    { title: 'Backend Dev', company: 'ShopUp', source: 'Direct application', date: 'May 20' },
    { title: 'SWE Intern', company: 'Pathao', source: 'Referral', date: 'May 21' },
  ],
  Interviewing: [
    { title: 'Backend Eng', company: 'bKash', source: 'Technical round scheduled', date: 'Jun 2', highlight: true },
  ],
  Offer: [],
  Rejected: [
    { title: 'Data Analyst', company: 'BRAC IT', source: 'No feedback given', date: 'May 15', faded: true },
  ],
}

const NUDGE = "You haven't applied this week. Here are 3 matching jobs: Backend Eng at Shajgoj (87%), Data Eng at Shohoz (81%), SWE at Chaldal (79%)."

// ─── nav config ──────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'AI Assistant', icon: MessageSquare, to: '/chat' },
  { label: 'Job Hunter', icon: Briefcase, to: '/jobs' },
  { label: 'Fit Score', icon: Target, to: '/fit-score' },
  { label: 'Tailor CV', icon: FileText, to: '/tailor-cv' },
  { label: 'Interview Coach', icon: Mic, to: '/interview' },
  { label: 'Outreach', icon: Send, to: '/outreach' },
]

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</span>
        <Icon size={15} className={accent} />
      </div>
      <span className="text-3xl font-bold text-white leading-none">{value}</span>
      <span className="text-xs text-gray-500">{sub}</span>
    </div>
  )
}

function RoadmapBadge({ status }) {
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded-full mt-1">
        <CheckCircle2 size={10} /> Done
      </span>
    )
  if (status === 'active')
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-violet-950 text-violet-400 border border-violet-800 px-2 py-0.5 rounded-full mt-1">
        <Clock size={10} /> In progress
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full mt-1">
      <Circle size={10} /> Upcoming
    </span>
  )
}

function KanbanColumn({ title, cards, count }) {
  const accentColor = {
    Applied: 'border-l-blue-500',
    Interviewing: 'border-l-emerald-500',
    Offer: 'border-l-violet-500',
    Rejected: 'border-l-gray-600',
  }

  return (
    <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex flex-col min-h-[160px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
        <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">{count}</span>
      </div>

      {cards.length === 0 ? (
        <p className="text-xs text-gray-600 text-center mt-4 flex-1">No offers yet — keep going!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs border-l-2 ${accentColor[title]} ${c.faded ? 'opacity-50' : ''}`}
            >
              <p className="font-semibold text-white">
                {c.title} · <span className="font-normal text-gray-400">{c.company}</span>
              </p>
              <p className="text-gray-500 mt-0.5">{c.source}</p>
              <p className="text-gray-600 mt-1">{c.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const [stats, setStats] = useState(MOCK_STATS)
  const [roadmap] = useState(MOCK_ROADMAP)
  const [kanban] = useState(MOCK_KANBAN)
  const [loading, setLoading] = useState(false)

  // Uncomment to fetch real stats once the backend endpoint exists:
  // useEffect(() => {
  //   axios.get('http://localhost:8000/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
  //     .then(res => setStats(res.data))
  //     .catch(() => {})
  // }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const roadmapDone = roadmap.filter((r) => r.status === 'done').length
  const roadmapPct = Math.round((roadmapDone / roadmap.length) * 100)

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
        {/* Logo */}
        <div className="px-4 pb-4 border-b border-gray-800 mb-2">
          <p className="text-sm font-semibold text-white">CareerPilot</p>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered career OS</p>
        </div>

        {/* Nav */}
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

        {/* AI Nudge */}
        <div className="mx-3 mt-4 p-3 bg-amber-950/50 border border-amber-800/50 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">AI Nudge</span>
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">{NUDGE}</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-white">Progress Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Weekly stats, roadmap, and streak</p>
          </div>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-violet-900 border border-violet-700 flex items-center justify-center text-xs font-semibold text-violet-300">
            {initials}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Greeting */}
          <div className="bg-violet-950/40 border border-violet-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
            <TrendingUp size={18} className="text-violet-400 shrink-0" />
            <p className="text-sm text-violet-200">
              Good to see you, <span className="font-semibold">{firstName}</span>. You're on a{' '}
              <span className="font-semibold text-violet-300">7-day streak</span> — keep the momentum going!
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Applications sent" value={stats.applications.value} sub={stats.applications.sub} icon={Send} accent="text-blue-400" />
            <StatCard label="Skills added" value={stats.skills.value} sub={stats.skills.sub} icon={BookOpen} accent="text-emerald-400" />
            <StatCard label="Roadmap progress" value={stats.roadmap.value} sub={stats.roadmap.sub} icon={TrendingUp} accent="text-violet-400" />
            <StatCard label="Day streak" value={stats.streak.value} sub={stats.streak.sub} icon={Flame} accent="text-orange-400" />
          </div>

          {/* Bottom two-column layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* Learning Roadmap */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Learning Roadmap</h2>
                <span className="text-xs text-violet-400 font-semibold">{roadmapPct}% done</span>
              </div>
              <p className="text-xs text-gray-600 mb-4">Backend → ML-ready</p>

              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-5">
                <div
                  className="bg-violet-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${roadmapPct}%` }}
                />
              </div>

              <div className="space-y-0">
                {roadmap.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 py-3 border-b border-gray-800 last:border-0 items-start"
                  >
                    <span className="text-xs font-medium text-gray-600 min-w-[56px] pt-0.5">{item.week}</span>
                    <div>
                      <p className={`text-sm ${item.status === 'done' ? 'text-gray-500 line-through' : item.status === 'active' ? 'text-white' : 'text-gray-400'}`}>
                        {item.task}
                      </p>
                      <RoadmapBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanban */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Application Tracker</h2>
                <Link to="/tracker" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition">
                  View full <ChevronRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(kanban).map(([col, cards]) => (
                  <KanbanColumn key={col} title={col} cards={cards} count={cards.length} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}