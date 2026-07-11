import { useState, useEffect } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'


export default function TailorCV() {
  const token = useAuthStore((s) => s.token)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [changesMade, setChangesMade] = useState(null)

  const [history, setHistory] = useState([])
  const [expandedChanges, setExpandedChanges] = useState({})

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/tailor/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(res.data.tailored_cvs || [])
    } catch (err) {
      console.error('Failed to fetch history', err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [token])

  const toggleExpand = (id) => {
    setExpandedChanges(prev => ({ ...prev, [id]: !prev[id] }))
  }

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

      // Refresh history to show the newly generated CV
      fetchHistory()
    } catch (err) {
      // If we got a blob but it's an error, we need to read it
      let detail = 'Failed to tailor CV'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          detail = json.detail || detail
        } catch (e) {
          // Ignore
        }
      } else {
        detail = err.response?.data?.detail || detail
      }
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (pdfUrl) => {
    if (!pdfUrl) return toast.error('No file available')
    const url = pdfUrl.replace('/upload/', '/upload/fl_attachment/')
    window.open(url, '_blank')
  }

  return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Auto-Tailor CV</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Paste a job description and get a PDF CV rewritten to match it — using only your real experience.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Job Title (optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Backend Engineer"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
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
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
              <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold mb-2">What was changed</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{changesMade}</p>
            </div>
          )}

          <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-3">How it works</p>
            <ol className="text-gray-500 dark:text-gray-400 text-sm space-y-2 list-decimal list-inside">
              <li>Your CV sections are retrieved via semantic search</li>
              <li>AI rewrites bullet points to match the JD keywords — no fabrication</li>
              <li>Sections are reordered by relevance to the role</li>
              <li>A clean PDF is generated and downloaded instantly</li>
            </ol>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Previous Tailored CVs</h2>

            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-10 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                No tailored CVs yet. Generate your first one above.
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.job_title || 'Tailored CV'}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.created_at}</p>
                      </div>
                      <button
                        onClick={() => handleDownload(item.pdf_url)}
                        className="bg-violet-600/20 hover:bg-violet-600/40 text-violet-700 dark:text-violet-300 text-sm px-4 py-1.5 rounded-lg transition"
                      >
                        Download
                      </button>
                    </div>

                    {item.job_description && (
                      <p className="text-sm text-gray-500 italic mb-3">
                        "{item.job_description}..."
                      </p>
                    )}

                    {item.changes_made && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition flex items-center"
                        >
                          {expandedChanges[item.id] ? 'Hide Changes' : 'View Changes'}
                        </button>

                        {expandedChanges[item.id] && (
                          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                            {item.changes_made}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
  )
}