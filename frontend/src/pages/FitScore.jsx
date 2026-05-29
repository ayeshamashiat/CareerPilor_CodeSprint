import { useState } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function FitScore() {
  const token = useAuthStore((s) => s.token)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async () => {
    if (!jobDescription.trim()) return toast.error('Please enter a job description')
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:8000/api/fit/score',
        { job_title: jobTitle, job_description: jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to compute fit score')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Fit Score</h1>
        <p className="text-gray-400 mb-8">Paste a job description to see how well your CV matches</p>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Job Title (optional)</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Paste the full job description here..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Compute Fit Score'}
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-gray-900 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overall Match</p>
                <p className="text-white text-4xl font-bold">{result.overall_score}%</p>
                <p className={`text-sm font-medium mt-1 ${
                  result.match_level === 'Strong Match' ? 'text-green-400' :
                  result.match_level === 'Moderate Match' ? 'text-yellow-400' : 'text-red-400'
                }`}>{result.match_level}</p>
              </div>
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-violet-500">
                <span className="text-white text-xl font-bold">{result.overall_score}%</span>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  result.overall_score >= 75 ? 'bg-green-500' :
                  result.overall_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.overall_score}%` }}
              />
            </div>

            <p className="text-gray-300 italic border-l-4 border-violet-500 pl-3">
              {result.explanation}
            </p>


            {result.ai_analysis && (
              <div className="bg-gray-800 rounded-xl p-4 mt-2">
                <p className="text-violet-400 text-sm font-semibold mb-2">AI Analysis</p>
                <p className="text-gray-300 text-sm leading-relaxed">{result.ai_analysis}</p>
              </div>
            )}

            <div>
              <p className="text-gray-400 text-sm font-medium mb-3">Section Breakdown</p>
              <div className="space-y-3">
                {result.section_scores.map((s) => (
                  <div key={s.section}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">{s.section}</span>
                      <span className="text-violet-400">{s.score}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}