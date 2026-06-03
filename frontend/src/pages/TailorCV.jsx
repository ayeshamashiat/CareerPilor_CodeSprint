import { useState } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'


export default function TailorCV() {
  const token = useAuthStore((s) => s.token)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [changesMade, setChangesMade] = useState(null)

  const handleTailor = async () => {
    if (!jobDescription.trim()) return toast.error('Please paste a job description')
    setLoading(true)
    setChangesMade(null)

    try {
      const response = await axios.post(
        'http://localhost:8000/api/tailor/cv',
        { job_title: jobTitle, job_description: jobDescription },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      )

      // Extract the changes note from response headers
      const changes = response.headers['x-changes-made']
      if (changes) setChangesMade(decodeURIComponent(changes))

      // Trigger PDF download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `tailored_cv_${jobTitle || 'role'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Tailored CV downloaded!')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to tailor CV'
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Auto-Tailor CV</h1>
          <p className="text-gray-400 mb-8">
            Paste a job description and get a PDF CV rewritten to match it — using only your real experience.
          </p>

          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Job Title (optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Backend Engineer"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Paste the full job description here..."
              />
            </div>

            <button
              onClick={handleTailor}
              disabled={loading || !jobDescription.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Generating tailored CV...' : 'Generate & Download PDF'}
            </button>
          </div>

          {changesMade && (
            <div className="mt-6 bg-gray-900 rounded-2xl p-5">
              <p className="text-violet-400 text-sm font-semibold mb-2">What was changed</p>
              <p className="text-gray-300 text-sm leading-relaxed">{changesMade}</p>
            </div>
          )}

          <div className="mt-6 bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-400 text-sm font-semibold mb-3">How it works</p>
            <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
              <li>Your CV sections are retrieved via semantic search</li>
              <li>AI rewrites bullet points to match the JD keywords — no fabrication</li>
              <li>Sections are reordered by relevance to the role</li>
              <li>A clean PDF is generated and downloaded instantly</li>
            </ol>
          </div>
        </div>
      </div>
  )
}