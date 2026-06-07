import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import {
  FileText, Sparkles, Mic, Target,
  TrendingUp, Download, ChevronRight,
  CheckCircle2, AlertCircle,
} from 'lucide-react'

const API = 'http://localhost:8000/api'

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

export default function Dashboard() {
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    axios.get(`${API}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const handleDownload = (pdfUrl) => {
    if (!pdfUrl) return
    const url = pdfUrl.replace('/upload/', '/upload/fl_attachment/')
    window.open(url, '_blank')
  }

  const scoreColor = (score) =>
    score >= 75 ? 'text-green-400' : score >= 55 ? 'text-yellow-400' : 'text-red-400'

  const greetingMsg = () => {
    if (!stats) return `Good to see you, ${firstName}.`
    if (!stats.cv.uploaded) return `Good to see you, ${firstName}. Upload your CV to unlock all features.`
    if (stats.interview_sessions.count > 0)
      return `Good to see you, ${firstName}. Avg interview score: ${stats.interview_sessions.avg_score}% — keep practising!`
    return `Good to see you, ${firstName}. Your CV is ready — tailor it or start a mock interview.`
  }

  return (
    <div className="px-6 py-5 space-y-6">

      {/* Greeting */}
      <div className="bg-violet-950/40 border border-violet-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
        <TrendingUp size={18} className="text-violet-400 shrink-0" />
        <p className="text-sm text-violet-200">{greetingMsg()}</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="CV Status"
            value={stats?.cv.uploaded ? 'Uploaded' : 'None'}
            sub={stats?.cv.filename || 'Go to Upload CV'}
            icon={FileText}
            accent={stats?.cv.uploaded ? 'text-green-400' : 'text-gray-500'}
          />
          <StatCard
            label="Tailored CVs"
            value={stats?.tailored_cvs.count ?? 0}
            sub="CVs generated"
            icon={Sparkles}
            accent="text-violet-400"
          />
          <StatCard
            label="Interview Sessions"
            value={stats?.interview_sessions.count ?? 0}
            sub="sessions completed"
            icon={Mic}
            accent="text-blue-400"
          />
          <StatCard
            label="Avg Interview Score"
            value={stats?.interview_sessions.avg_score ? `${stats.interview_sessions.avg_score}%` : '—'}
            sub={stats?.interview_sessions.count > 0 ? 'across all sessions' : 'No sessions yet'}
            icon={Target}
            accent="text-orange-400"
          />
        </div>
      )}

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Recent Tailored CVs */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Tailored CVs</h2>
            <Link to="/tailor-cv" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition">
              Go to Tailor CV <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : stats?.tailored_cvs.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={24} className="text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No tailored CVs yet.</p>
              <Link to="/tailor-cv" className="text-xs text-violet-400 hover:underline mt-1">Generate one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.tailored_cvs.recent.map((cv) => (
                <div key={cv.id} className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{cv.job_title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cv.created_at}</p>
                    {cv.changes_made && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{cv.changes_made}</p>
                    )}
                  </div>
                  {cv.pdf_url && (
                    <button
                      onClick={() => handleDownload(cv.pdf_url)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-gray-800 transition shrink-0"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Interview Sessions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Interview Sessions</h2>
            <Link to="/interview" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition">
              Go to Coach <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : stats?.interview_sessions.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={24} className="text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No interview sessions yet.</p>
              <Link to="/interview" className="text-xs text-violet-400 hover:underline mt-1">Start a session →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.interview_sessions.recent.map((s) => (
                <div key={s.id} className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.job_title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.created_at} · {s.questions_count} questions</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${scoreColor(s.overall_score)}`}>{s.overall_score}%</p>
                    <p className="text-xs text-gray-500">{s.readiness_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CV not uploaded warning */}
      {!loading && !stats?.cv.uploaded && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">No CV uploaded. Most features require a CV to work.</p>
          </div>
          <Link to="/cv-upload" className="text-xs text-amber-400 hover:underline shrink-0">Upload now →</Link>
        </div>
      )}

    </div>
  )
}