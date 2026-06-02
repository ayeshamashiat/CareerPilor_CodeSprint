import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'

export default function CVUpload() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState(null)
  const [greeting, setGreeting] = useState(null)
  const [completeness, setCompleteness] = useState(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file first')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post('http://localhost:8000/api/cv/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setSections(res.data.sections_indexed)
      setGreeting(res.data.greeting)
      setCompleteness(res.data.completeness)
      toast.success('CV uploaded and indexed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Upload your CV</h1>
          <p className="text-gray-400 mb-8">PDF or DOCX — this becomes your career profile</p>

          <div
            className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-violet-500 transition"
            onClick={() => document.getElementById('cv-input').click()}
          >
            {file ? (
              <p className="text-violet-400 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-gray-400 text-lg mb-1">Click to select file</p>
                <p className="text-gray-600 text-sm">PDF or DOCX only</p>
              </>
            )}
            <input
              id="cv-input"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Uploading and indexing...' : 'Upload CV'}
          </button>

          {sections && (
            <div className="mt-6 p-4 bg-gray-800 rounded-xl">
             {greeting && (
              <p className="text-gray-300 italic mb-4 border-l-4 border-violet-500 pl-3">
               {greeting}
              </p>
              )}
              {completeness && (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-400 text-sm">CV Completeness</span>
        <span className="text-violet-400 font-bold">{completeness.score}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-violet-500 h-2 rounded-full transition-all"
          style={{ width: `${completeness.score}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-xs font-medium ${
          completeness.level === 'Excellent' ? 'text-green-400' :
          completeness.level === 'Good' ? 'text-blue-400' :
          completeness.level === 'Fair' ? 'text-yellow-400' : 'text-red-400'
        }`}>{completeness.level}</span>
        {completeness.missing.length > 0 && (
          <span className="text-xs text-gray-500">
            Missing: {completeness.missing.join(', ')}
          </span>
        )}
      </div>
    </div>
  )}
              <p className="text-green-400 font-semibold mb-2">Sections indexed:</p>
              <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                  <span key={s} className="bg-violet-900 text-violet-300 px-3 py-1 rounded-full text-sm capitalize">
                    {s}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}