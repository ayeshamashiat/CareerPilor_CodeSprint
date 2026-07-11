import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'


export default function CVUpload() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const [checking, setChecking] = useState(true)
  const [cvInfo, setCvInfo] = useState(null)
  const [replaceMode, setReplaceMode] = useState(false)
  
  // These are now kept for the upload form
  const [sections, setSections] = useState(null)
  const [greeting, setGreeting] = useState(null)
  const [completeness, setCompleteness] = useState(null)

  const checkCvStatus = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/cv/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.has_cv) {
        setCvInfo(res.data)
      } else {
        setCvInfo(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkCvStatus()
  }, [token])

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
      
      toast.success('CV uploaded and indexed')
      
      // Update cvInfo with new upload info
      await checkCvStatus()
      
      // Reset upload states and return to Mode B
      setFile(null)
      setReplaceMode(false)
      setSections(res.data.sections_indexed)
      setGreeting(res.data.greeting)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">Loading...</div>
  }

  // Render Completeness UI Helper
  const renderCompleteness = (comp) => {
    if (!comp) return null
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-500 dark:text-gray-400 text-sm">CV Completeness</span>
          <span className="text-violet-600 dark:text-violet-400 font-bold">{comp.score}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-violet-500 h-2 rounded-full transition-all"
            style={{ width: `${comp.score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-xs font-medium ${
            comp.level === 'Excellent' ? 'text-green-600 dark:text-green-400' :
            comp.level === 'Good' ? 'text-blue-600 dark:text-blue-400' :
            comp.level === 'Fair' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          }`}>{comp.level}</span>
          {comp.missing?.length > 0 && (
            <span className="text-xs text-gray-500">
              Missing: {comp.missing.join(', ')}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Mode B: CV already on file
  if (cvInfo && !replaceMode) {
    const uploadDate = new Date(cvInfo.uploaded_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your current CV</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">This is your active career profile.</p>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-violet-600 dark:text-violet-400 font-medium truncate max-w-[200px]" title={cvInfo.filename}>
                  {cvInfo.filename}
                </p>
                <p className="text-gray-500 text-sm">Uploaded {uploadDate}</p>
              </div>
              <button
                onClick={() => window.open(cvInfo.cloudinary_url, '_blank')}
                className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-1 px-3 rounded-lg transition"
              >
                View PDF
              </button>
            </div>

            {renderCompleteness(cvInfo.completeness)}

            <div className="mt-4">
              <p className="text-green-600 dark:text-green-400 text-sm font-semibold mb-2">Sections indexed:</p>
              <div className="flex flex-wrap gap-2">
                {cvInfo.sections_indexed?.map((s) => (
                  <span key={s} className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full text-xs capitalize">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {greeting && (
            <p className="text-gray-700 dark:text-gray-300 italic mb-6 border-l-4 border-violet-500 pl-3">
              {greeting}
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => setReplaceMode(true)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition"
            >
              Replace CV
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mode A: Upload Form (First time or Replacing)
  return (
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload your CV</h1>
            {replaceMode && (
              <button onClick={() => setReplaceMode(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
                Cancel
              </button>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-8">PDF or DOCX — this becomes your career profile</p>

          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-violet-500 transition"
            onClick={() => document.getElementById('cv-input').click()}
          >
            {file ? (
              <p className="text-violet-600 dark:text-violet-400 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-1">Click to select file</p>
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
        </div>
      </div>
  )
}