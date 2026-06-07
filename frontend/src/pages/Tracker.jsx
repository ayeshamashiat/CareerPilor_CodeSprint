import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, ChevronLeft, ChevronRight,
  X, CheckSquare, Square, Flame, AlertCircle,
  Send, Briefcase, Trophy, XCircle, ArrowRight, ArrowLeft,
  CalendarDays, ListTodo, LayoutGrid,
} from 'lucide-react'

const API = 'http://localhost:8000/api/tracker'
const COLUMNS = ['Applied', 'Interviewing', 'Offer', 'Rejected']

const COL_CONFIG = {
  Applied: {
    border: 'border-t-blue-500',
    cardBorder: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    accent: 'text-blue-400',
    icon: Send,
    glow: 'hover:shadow-blue-500/10',
    headerBg: 'from-blue-500/10 to-transparent',
  },
  Interviewing: {
    border: 'border-t-emerald-500',
    cardBorder: 'border-l-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    accent: 'text-emerald-400',
    icon: Briefcase,
    glow: 'hover:shadow-emerald-500/10',
    headerBg: 'from-emerald-500/10 to-transparent',
  },
  Offer: {
    border: 'border-t-violet-500',
    cardBorder: 'border-l-violet-500',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    accent: 'text-violet-400',
    icon: Trophy,
    glow: 'hover:shadow-violet-500/10',
    headerBg: 'from-violet-500/10 to-transparent',
  },
  Rejected: {
    border: 'border-t-gray-500',
    cardBorder: 'border-l-gray-600',
    badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    accent: 'text-gray-400',
    icon: XCircle,
    glow: 'hover:shadow-gray-500/10',
    headerBg: 'from-gray-500/10 to-transparent',
  },
}

export default function Tracker() {
  const { token } = useAuthStore()
  const [tab, setTab] = useState('kanban')
  const [applications, setApplications] = useState([])
  const [todos, setTodos] = useState([])
  const [streak, setStreak] = useState(null)
  const [nudge, setNudge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newApp, setNewApp] = useState({ company: '', role: '', location: '', notes: '', deadline: '', source: '' })
  const [newTodo, setNewTodo] = useState({ text: '', due_date: '' })
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [movingId, setMovingId] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { fetchAll() }, [token])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [appsRes, todosRes, streakRes, nudgeRes] = await Promise.all([
        axios.get(`${API}/applications`, { headers }),
        axios.get(`${API}/todos`, { headers }),
        axios.get(`${API}/streak`, { headers }),
        axios.get(`${API}/nudge`, { headers }),
      ])
      setApplications(appsRes.data.applications)
      setTodos(todosRes.data.todos)
      setStreak(streakRes.data)
      setNudge(nudgeRes.data.nudge)
    } catch {}
    setLoading(false)
  }

  const addApplication = async () => {
    if (!newApp.company || !newApp.role) return toast.error('Company and role are required')
    try {
      const res = await axios.post(`${API}/applications`, newApp, { headers })
      setApplications(prev => [res.data, ...prev])
      setNewApp({ company: '', role: '', location: '', notes: '', deadline: '', source: '' })
      setShowModal(false)
      toast.success('Application added')
    } catch { toast.error('Failed to add') }
  }

  const moveApp = async (app, dir) => {
    const idx = COLUMNS.indexOf(app.column)
    const next = COLUMNS[idx + dir]
    if (!next) return
    setMovingId(app.id)
    try {
      await axios.patch(`${API}/applications/${app.id}`, { column: next }, { headers })
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, column: next } : a))
    } catch { toast.error('Failed to move') }
    setMovingId(null)
  }

  const deleteApp = async (id) => {
    try {
      await axios.delete(`${API}/applications/${id}`, { headers })
      setApplications(prev => prev.filter(a => a.id !== id))
      toast.success('Removed')
    } catch {}
  }

  const addTodo = async () => {
    if (!newTodo.text.trim()) return toast.error('Enter a task')
    try {
      const res = await axios.post(`${API}/todos`, newTodo, { headers })
      setTodos(prev => [res.data, ...prev])
      setNewTodo({ text: '', due_date: '' })
    } catch { toast.error('Failed to add') }
  }

  const toggleTodo = async (id) => {
    try {
      await axios.patch(`${API}/todos/${id}`, {}, { headers })
      setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    } catch {}
  }

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API}/todos/${id}`, { headers })
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch {}
  }

  const byCol = (col) => applications.filter(a => a.column === col)

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const appDatesMap = {}
  applications.forEach(app => {
    const d = new Date(app.created_at_iso || app.created_at)
    if (!isNaN(d) && d.getFullYear() === year && d.getMonth() === month) {
      appDatesMap[d.getDate()] = (appDatesMap[d.getDate()] || 0) + 1
    }
  })

  const appsThisMonth = applications.filter(app => {
    const d = new Date(app.created_at_iso || app.created_at)
    return !isNaN(d) && d.getFullYear() === year && d.getMonth() === month
  })

  const doneTodos = todos.filter(t => t.done).length
  const pendingTodos = todos.filter(t => !t.done).length

  return (
    <div className="px-6 py-5 space-y-5">

      {/* Nudge */}
      {nudge && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">{nudge}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/jobs" className="text-xs text-amber-400 hover:underline font-medium">Find jobs →</Link>
            <button onClick={() => setNudge(null)} className="text-amber-700 hover:text-amber-400 transition"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map(col => {
          const cfg = COL_CONFIG[col]
          const Icon = cfg.icon
          const count = byCol(col).length
          return (
            <div key={col}
              className={`bg-gray-900 border border-gray-800 border-t-2 ${cfg.border} rounded-xl p-4 hover:bg-gray-800/60 hover:shadow-lg ${cfg.glow} transition-all duration-200 cursor-default group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">{col}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cfg.headerBg} border border-gray-800 group-hover:scale-110 transition-transform`}>
                  <Icon size={12} className={cfg.accent} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${cfg.accent} leading-none`}>{count}</p>
              <p className="text-xs text-gray-600 mt-1">{count === 1 ? 'application' : 'applications'}</p>
            </div>
          )
        })}
        <div className="bg-gray-900 border border-gray-800 border-t-2 border-t-orange-500 rounded-xl p-4 hover:bg-gray-800/60 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200 cursor-default group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Streak</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-gray-800 group-hover:scale-110 transition-transform">
              <Flame size={12} className="text-orange-400" />
            </div>
          </div>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-bold text-orange-400 leading-none">{streak?.streak ?? 0}</p>
            <Flame size={16} className="text-orange-400 mb-0.5" />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {streak?.applied_today ? '✓ Active today' : streak?.this_week ? `${streak.this_week} this week` : 'No activity'}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {[
            { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
            { id: 'todo', label: 'To-Do', icon: ListTodo },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={13} /> {label}
              {id === 'todo' && pendingTodos > 0 && (
                <span className="bg-violet-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {pendingTodos}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus size={15} /> Add Application
        </button>
      </div>

      {/* ── KANBAN ── */}
      {tab === 'kanban' && (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const cfg = COL_CONFIG[col]
            const Icon = cfg.icon
            const cards = byCol(col)
            return (
              <div key={col}
                className={`bg-gray-900 border border-gray-800 border-t-2 ${cfg.border} rounded-xl overflow-hidden`}
              >
                {/* Column header */}
                <div className={`bg-gradient-to-b ${cfg.headerBg} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={cfg.accent} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.accent}`}>{col}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-2 min-h-[120px]">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                      <Icon size={22} className={cfg.accent} />
                      <p className="text-xs text-gray-500 mt-2">No applications</p>
                    </div>
                  ) : cards.map(app => (
                    <div key={app.id}
                      className={`bg-gray-950 border border-gray-800/80 border-l-2 ${cfg.cardBorder} rounded-lg p-3 
                        hover:border-gray-700 hover:bg-gray-900 hover:shadow-md transition-all duration-150 group/card
                        ${movingId === app.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate leading-tight">{app.role}</p>
                          <p className={`text-xs font-medium mt-0.5 ${cfg.accent}`}>{app.company}</p>
                          {app.location && <p className="text-xs text-gray-600 mt-0.5">{app.location}</p>}
                          {app.source && (
                            <span className="inline-block text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded mt-1">
                              {app.source}
                            </span>
                          )}
                          {app.deadline && (
                            <p className="text-xs text-amber-500 mt-1 font-medium">⏰ {app.deadline}</p>
                          )}
                          {app.notes && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{app.notes}</p>
                          )}
                          <p className="text-xs text-gray-700 mt-1.5">{app.created_at}</p>
                        </div>
                        <button onClick={() => deleteApp(app.id)}
                          className="opacity-0 group-hover/card:opacity-100 text-gray-700 hover:text-red-400 transition-all shrink-0 p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Move buttons */}
                      <div className="flex gap-1.5 mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        {COLUMNS.indexOf(col) > 0 && (
                          <button onClick={() => moveApp(app, -1)}
                            className="flex-1 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <ArrowLeft size={11} />
                            <span className="text-xs">{COLUMNS[COLUMNS.indexOf(col) - 1].slice(0, 4)}</span>
                          </button>
                        )}
                        {COLUMNS.indexOf(col) < COLUMNS.length - 1 && (
                          <button onClick={() => moveApp(app, 1)}
                            className="flex-1 py-1.5 rounded-md bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 hover:text-violet-300 text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <span className="text-xs">{COLUMNS[COLUMNS.indexOf(col) + 1].slice(0, 4)}</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TODO ── */}
      {tab === 'todo' && (
        <div className="max-w-2xl space-y-3">
          {/* Progress bar */}
          {todos.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">{doneTodos} of {todos.length} tasks completed</span>
                <span className="text-xs text-violet-400 font-semibold">{Math.round((doneTodos / todos.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(doneTodos / todos.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Add todo */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
            <input type="text" value={newTodo.text}
              onChange={e => setNewTodo(p => ({ ...p, text: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 border border-gray-700 focus:border-violet-500 transition-colors"
              placeholder="Add a task... (press Enter)" />
            <input type="date" value={newTodo.due_date}
              onChange={e => setNewTodo(p => ({ ...p, due_date: e.target.value }))}
              className="bg-gray-800 text-gray-400 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 border border-gray-700" />
            <button onClick={addTodo}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/20"
            >Add</button>
          </div>

          {/* Todo list */}
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListTodo size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">No tasks yet. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pending first */}
              {todos.filter(t => !t.done).map(todo => (
                <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
              ))}
              {/* Divider if both */}
              {doneTodos > 0 && pendingTodos > 0 && (
                <p className="text-xs text-gray-600 uppercase tracking-wider font-medium pt-2 pb-1 px-1">Completed</p>
              )}
              {todos.filter(t => t.done).map(todo => (
                <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === 'calendar' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <p className="text-white font-bold text-lg">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs text-gray-600 font-semibold py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                const count = appDatesMap[day] || 0
                return (
                  <div key={day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all cursor-default
                      ${isToday
                        ? 'bg-violet-600 text-white font-bold shadow-lg shadow-violet-500/30'
                        : count > 0
                          ? 'bg-violet-950/60 text-violet-300 border border-violet-800/50 hover:bg-violet-900/50'
                          : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                      }`}
                  >
                    <span className="leading-none">{day}</span>
                    {count > 0 && (
                      <span className={`text-xs leading-none mt-0.5 font-bold ${isToday ? 'text-violet-200' : 'text-violet-400'}`}>
                        {count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-4 mt-5 pt-4 border-t border-gray-800 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-lg bg-violet-600 inline-block shadow-sm shadow-violet-500/30" />
                Today
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-lg bg-violet-950/60 border border-violet-800/50 inline-block" />
                Application added
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Applications this month
              <span className="ml-2 text-violet-400 normal-case">{appsThisMonth.length} total</span>
            </p>
            {appsThisMonth.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-900 border border-gray-800 rounded-xl">
                <CalendarDays size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">No applications this month.</p>
              </div>
            ) : appsThisMonth.map(app => {
              const cfg = COL_CONFIG[app.column]
              return (
                <div key={app.id}
                  className={`bg-gray-900 border border-gray-800 border-l-2 ${cfg.cardBorder} rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{app.role} · {app.company}</p>
                    <p className="text-xs text-gray-500">{app.created_at}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${cfg.badge}`}>{app.column}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold text-lg">Add Application</h3>
                <p className="text-xs text-gray-500 mt-0.5">Track a new job application</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'role', label: 'Role *', placeholder: 'e.g. Backend Engineer' },
                  { key: 'company', label: 'Company *', placeholder: 'e.g. bKash' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 mb-1 block font-medium">{label}</label>
                    <input type="text" value={newApp[key]}
                      onChange={e => setNewApp(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
              {[
                { key: 'location', label: 'Location', placeholder: 'e.g. Dhaka' },
                { key: 'source', label: 'Source', placeholder: 'e.g. LinkedIn, Referral' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">{label}</label>
                  <input type="text" value={newApp[key]}
                    onChange={e => setNewApp(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Deadline</label>
                <input type="date" value={newApp.deadline}
                  onChange={e => setNewApp(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Notes</label>
                <textarea value={newApp.notes} onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                  placeholder="Any notes about this application..." />
              </div>
            </div>
            <button onClick={addApplication}
              className="w-full mt-5 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20"
            >Add Application</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TodoItem({ todo, onToggle, onDelete }) {
  const isOverdue = todo.due_date && !todo.done && new Date(todo.due_date) < new Date()
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3
      hover:border-gray-700 hover:bg-gray-800/50 transition-all duration-150 group
      ${todo.done ? 'opacity-60' : ''}`}
    >
      <button onClick={() => onToggle(todo.id)}
        className={`shrink-0 transition-all hover:scale-110 ${todo.done ? 'text-violet-400' : 'text-gray-600 hover:text-violet-400'}`}
      >
        {todo.done ? <CheckSquare size={17} /> : <Square size={17} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-white ${todo.done ? 'line-through text-gray-500' : ''}`}>{todo.text}</p>
        {todo.due_date && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
            {isOverdue ? '⚠ Overdue: ' : 'Due: '}{todo.due_date}
          </p>
        )}
      </div>
      <button onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 shrink-0 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}