import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import {
  User, Mail, Lock, FileText, Trash2, Download,
  ChevronDown, ChevronUp, Calendar, Sparkles, Eye, EyeOff,
} from 'lucide-react'

function SectionHeader({ children }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      {children}
    </h2>
  )
}

function ReadOnlyField({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 flex items-center gap-1.5">
        <Icon size={11} className="text-gray-600" /> {label}
      </label>
      <div className="bg-gray-800/50 border border-gray-800 rounded-lg px-3 py-2">
        <span className="text-sm text-white">
          {value || <span className="text-gray-600 italic">Not set</span>}
        </span>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-950 border border-red-800 mx-auto mb-4">
          <Trash2 size={16} className="text-red-400" />
        </div>
        <h3 className="text-white font-semibold text-center mb-1">Delete this CV?</h3>
        <p className="text-gray-500 text-sm text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function TailoredCVCard({ cv, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDownload = () => {
    if (!cv.pdf_url) return toast.error('No file available')
    const url = cv.pdf_url.replace('/upload/', '/upload/fl_attachment/')
    window.open(url, '_blank')
  }

  return (
    <>
      {confirming && (
        <ConfirmDeleteModal
          onConfirm={() => { setConfirming(false); onDelete(cv.id) }}
          onCancel={() => setConfirming(false)}
        />
      )}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-start justify-between px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-violet-950 border border-violet-800">
              <Sparkles size={13} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{cv.job_title || 'Untitled'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={10} /> {cv.created_at}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cv.pdf_url ? (
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-gray-800 transition"
                title="Download"
              >
                <Download size={14} />
              </button>
            ) : null}
            <button
              onClick={() => setConfirming(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-800 pt-3">
            <p className="text-xs text-violet-400 font-semibold mb-1">What was changed</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {cv.changes_made || 'No details available'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default function Profile() {
  const { user, token } = useAuthStore()
  const [cvMetadata, setCvMetadata] = useState(null)
  const [tailoredCVs, setTailoredCVs] = useState([])
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:8000/api/cv/metadata', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setCvMetadata(res.data)).catch(() => {})

      axios.get('http://localhost:8000/api/tailor/history', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setTailoredCVs(res.data.tailored_cvs || [])).catch(() => {})
    }
  }, [token])

  const name = user?.name || ''
  const email = user?.email || ''
  const mainCVName = cvMetadata?.filename || null

  const handlePasswordSave = async () => {
    if (passwords.next !== passwords.confirm) return toast.error('Passwords do not match')
    if (passwords.next.length < 8) return toast.error('Password must be at least 8 characters')
    setSavingPassword(true)
    try {
      await axios.post(
        'http://localhost:8000/api/auth/change-password',
        { current_password: passwords.current, new_password: passwords.next },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Password changed successfully')
      setPasswords({ current: '', next: '', confirm: '' })
      setShowPasswords({ current: false, next: false, confirm: false })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleTailoredDelete = (id) => {
    setTailoredCVs((prev) => prev.filter((c) => c.id !== id))
    toast.success('Deleted')
  }

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="px-6 py-5 max-w-3xl mx-auto space-y-6">

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-violet-950 border-2 border-violet-700 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-violet-300">{initials}</span>
        </div>
        <div>
          <p className="text-white font-semibold text-lg leading-tight">{name}</p>
          <p className="text-gray-500 text-sm">{email}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-violet-950 text-violet-400 border border-violet-800 px-3 py-1 rounded-full font-medium">
            Free plan
          </span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <SectionHeader><User size={12} /> Account Info</SectionHeader>
        <ReadOnlyField label="Full name" value={name} icon={User} />
        <ReadOnlyField label="Email address" value={email} icon={Mail} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <SectionHeader><Lock size={12} /> Change Password</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'current', label: 'Current password' },
            { key: 'next', label: 'New password' },
            { key: 'confirm', label: 'Confirm new password' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{label}</label>
              <div className="relative flex items-center">
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  className="bg-gray-800 text-white rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-violet-500 border border-gray-700 w-full"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPasswords[key] ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-2.5 text-gray-500 hover:text-gray-300 transition flex items-center justify-center"
                >
                  {showPasswords[key] ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handlePasswordSave}
            disabled={savingPassword || !passwords.current || !passwords.next || !passwords.confirm}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
          >
            {savingPassword ? 'Saving...' : 'Update password'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <SectionHeader><FileText size={12} /> Main CV</SectionHeader>
        <p className="text-xs text-gray-600 -mt-2">Your base CV used to generate all tailored versions.</p>
        {mainCVName ? (
          <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800">
              <FileText size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{mainCVName}</p>
              <p className="text-xs text-gray-600">PDF · Active</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-xl px-4 py-4">
            <div className="p-2 rounded-lg bg-gray-800 border border-gray-700">
              <FileText size={14} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-600">
              No CV uploaded yet. Upload one from the CV page.
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <SectionHeader><Sparkles size={12} /> Tailored CVs</SectionHeader>
          <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full -mt-4">
            {tailoredCVs.length} saved
          </span>
        </div>
        <p className="text-xs text-gray-600 -mt-2">CVs auto-generated for specific job applications.</p>
        {tailoredCVs.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">
            No tailored CVs yet — head to{' '}
            <Link to="/tailor-cv" className="text-violet-400 hover:underline">Tailor CV</Link>
            {' '}to generate one.
          </p>
        ) : (
          <div className="space-y-2">
            {tailoredCVs.map((cv) => (
              <TailoredCVCard
                key={cv.id}
                cv={cv}
                onDelete={handleTailoredDelete}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}