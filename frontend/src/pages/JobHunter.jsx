import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import useJobStore from '../store/jobStore'


import {
  Briefcase,
  FileText,
  Target,
  Mic,
  Search,
  MapPin,
  Banknote,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles,
  BookmarkPlus,
} from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────
function fitColor(score) {
  if (score >= 75) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-300 dark:border-green-800', bar: 'bg-green-500' }
  if (score >= 55) return { text: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-950',  border: 'border-amber-300 dark:border-amber-800',  bar: 'bg-amber-500'  }
  return              { text: 'text-red-600 dark:text-red-400',   bg: 'bg-red-100 dark:bg-red-950',    border: 'border-red-300 dark:border-red-800',    bar: 'bg-red-500'    }
}

function fitLabel(score) {
  if (score >= 75) return 'Strong Match'
  if (score >= 55) return 'Moderate Match'
  return 'Weak Match'
}

function barColor(pct) {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 55) return 'bg-amber-500'
  return 'bg-violet-500'
}

// ─── sub-components ───────────────────────────────────────────────────────────

function FitBar({ label, value }) {
  return (
    <div className="mt-2.5">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className={value >= 75 ? 'text-green-600 dark:text-green-400' : value >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function JobCard({ job, selected, onClick, onSave }) {
  const fit = fitColor(job.overall_score)
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 border cursor-pointer transition-all duration-150 group ${
        selected
          ? 'border-violet-600 bg-gray-50 dark:bg-gray-900 shadow-lg shadow-violet-200/40 dark:shadow-violet-950/30'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600'
      }`}
    >
      {/* top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.company} · {job.location}</p>
        </div>
        <div className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${fit.bg} ${fit.border} ${fit.text}`}>
          {job.overall_score}% fit
        </div>
      </div>

      {/* meta */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-1">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {job.location}
          </span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1">
            <Banknote size={11} /> {job.salary}
          </span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1">
            <CalendarDays size={11} /> Deadline {job.deadline}
          </span>
        )}
      </div>

      {/* fit bars */}
      {job.section_scores?.map((s) => (
        <FitBar key={s.section} label={s.section} value={s.score} />
      ))}

      {/* actions — visible on selected or hover */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg transition"
            >
              Apply now <ExternalLink size={11} />
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSave(job) }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition"
          >
            <BookmarkPlus size={13} /> Save
          </button>
          <Link
            to="/tailor-cv"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition"
          >
            <FileText size={13} /> Tailor CV
          </Link>
        </div>
      )}
    </div>
  )
}

function AgentExplanation({ explanation }) {
  if (!explanation) return null
  return (
    <div className="mt-4 bg-violet-100/60 dark:bg-violet-950/30 border border-violet-300/60 dark:border-violet-800/40 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} className="text-violet-600 dark:text-violet-400" />
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Agent analysis</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{explanation}</p>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function JobHunter() {
  const token = useAuthStore((s) => s.token)

const {
  results, setResults,
  selected, setSelected,
  query, setQuery,
  location: storedLocation, setLocation,
  searched, setSearched,
  agentMsg, setAgentMsg
} = useJobStore()

const [locInput, setLocInput] = useState(storedLocation)
const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return toast.error('Enter a job title or keyword')
    setLoading(true)
    setSearched(false)
    setResults([])
    setSelected(null)
    setAgentMsg('')
    setLocation(locInput) 
    try {
      const res = await axios.post(
        'http://localhost:8000/api/jobs/search',
        { query: query.trim(), location: locInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResults(res.data.jobs || [])
      setAgentMsg(res.data.agent_message || '')
      setSearched(true)
      if (res.data.jobs?.length) setSelected(res.data.jobs[0])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (job) => {
  try {
    await axios.post(
      'http://localhost:8000/api/tracker/applications',
      {
        role: job.title,
        company: job.company,
        location: job.location || '',
        source: 'Job Hunter',
        notes: job.explanation || '',
        deadline: job.deadline || '',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    toast.success('Saved to Tracker')
  } catch {
    toast.error('Failed to save')
  }
}

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Job Hunter</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live search + fit scores grounded in your CV</p>
        </div>

          {/* Search bar */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex gap-3 max-w-3xl">
              {/* Keyword input */}
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. ML engineer internship, backend developer…"
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500 dark:placeholder-gray-600"
                />
              </div>

              {/* Location input */}
              <div className="w-36 relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Location"
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm rounded-lg pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500 dark:placeholder-gray-600"
                />
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm px-5 rounded-lg transition"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Search size={15} />
                )}
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-hidden flex">

            {/* Left — job list */}
            <div className="w-[420px] shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-800 p-4 space-y-3">

              {/* Loading skeleton */}
              {loading && (
                <>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 space-y-3 animate-pulse">
                      <div className="flex justify-between">
                        <div className="space-y-2">
                          <div className="h-3.5 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                          <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
                    </div>
                  ))}
                </>
              )}

              {/* Empty state — before first search */}
              {!loading && !searched && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
                    <Briefcase size={24} className="text-gray-500 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Find your next role</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Type a job title above and hit Search. The agent will query live listings and score each one against your CV.
                  </p>
                </div>
              )}

              {/* Empty state — after search with no results */}
              {!loading && searched && results.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No results found</p>
                  <p className="text-xs text-gray-600">Try a broader keyword or different location.</p>
                </div>
              )}

              {/* Results */}
              {!loading && results.map((job, i) => (
                <JobCard
                  key={i}
                  job={job}
                  selected={selected === job}
                  onClick={() => setSelected(job)}
                  onSave={handleSave}
                />
              ))}
            </div>

            {/* Right — detail panel */}
            <div className="flex-1 overflow-y-auto p-6">

              {!selected && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
                    <Target size={28} className="text-gray-400 dark:text-gray-700" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Select a job to see full details</p>
                </div>
              )}

              {selected && (
                <div className="max-w-full space-y-5">

                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selected.company}</p>
                      </div>
                      {(() => {
                        const fit = fitColor(selected.overall_score)
                        return (
                          <div className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-full border ${fit.bg} ${fit.border} ${fit.text}`}>
                            {selected.overall_score}% fit
                          </div>
                        )
                      })()}
                    </div>

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selected.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full">
                          <MapPin size={11} /> {selected.location}
                        </span>
                      )}
                      {selected.salary && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full">
                          <Banknote size={11} /> {selected.salary}
                        </span>
                      )}
                      {selected.deadline && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full">
                          <CalendarDays size={11} /> Deadline {selected.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overall score bar */}
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Overall Match</span>
                      <span className={`text-sm font-semibold ${fitColor(selected.overall_score).text}`}>
                        {fitLabel(selected.overall_score)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${fitColor(selected.overall_score).bar}`}
                        style={{ width: `${selected.overall_score}%` }}
                      />
                    </div>

                    {/* Section breakdown */}
                    {selected.section_scores?.length > 0 && (
                      <div className="mt-4 space-y-0.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Section breakdown</p>
                        {selected.section_scores.map((s) => (
                          <FitBar key={s.section} label={s.section} value={s.score} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Match explanation */}
                  {selected.explanation && (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Why this match</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selected.explanation}</p>
                    </div>
                  )}

                  {/* Job description */}
                  {selected.description && (
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Job description</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{selected.description}</p>
                    </div>
                  )}

                  {/* CTA buttons */}
                  <div className="flex gap-3">
                    {selected.url && (
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm py-3 rounded-xl transition"
                      >
                        Apply now <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => handleSave(selected)}
                      className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm px-4 py-3 rounded-xl transition"
                    >
                      <BookmarkPlus size={15} /> Save
                    </button>
                    <Link
                      to="/tailor-cv"
                      className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm px-4 py-3 rounded-xl transition"
                    >
                      <FileText size={15} /> Tailor CV
                    </Link>
                  </div>

                  {/* Quick links to other features */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/fit-score"
                      className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      <Target size={15} className="text-violet-600 dark:text-violet-400" />
                      <span>Deep fit analysis</span>
                      <ChevronRight size={13} className="ml-auto" />
                    </Link>
                    <Link
                      to="/interview"
                      className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      <Mic size={15} className="text-violet-600 dark:text-violet-400" />
                      <span>Mock interview</span>
                      <ChevronRight size={13} className="ml-auto" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Agent explanation — shown below selected job detail */}
              {agentMsg && <AgentExplanation explanation={agentMsg} />}
            </div>
          </div>
      </div>
  )
}