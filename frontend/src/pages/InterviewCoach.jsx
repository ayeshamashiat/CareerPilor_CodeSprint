import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, Volume2, ChevronDown, ChevronUp,
  RotateCcw, Download, Clock, History
} from 'lucide-react'

const PHASES = { SETUP: 'setup', INTERVIEW: 'interview', DONE: 'done' }
const API = 'http://localhost:8000/api/interview'

export default function InterviewCoach() {
  const token = useAuthStore((s) => s.token)

  // Setup
  const [phase, setPhase] = useState(PHASES.SETUP)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [useTimer, setUseTimer] = useState(false)
  const [timerDuration, setTimerDuration] = useState(120)

  // Interview
  const [questions, setQuestions] = useState([])
  const [cvContext, setCvContext] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [allScores, setAllScores] = useState([])
  const [allEvals, setAllEvals] = useState([])
  const [loading, setLoading] = useState(false)

  // Timer
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  const [autoSubmit, setAutoSubmit] = useState(false)

  // UI
  const [isListening, setIsListening] = useState(false)
  const [showPrevAnswers, setShowPrevAnswers] = useState(false)
  const [showCVContext, setShowCVContext] = useState(false)
  const [sessionSaved, setSessionSaved] = useState(false)
  const [sessions, setSessions] = useState([])
  const [showSessions, setShowSessions] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recognitionRef = useRef(null)
  const answerRef = useRef(answer)
  useEffect(() => { answerRef.current = answer }, [answer])

  
useEffect(() => {
  const prime = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance('')
      window.speechSynthesis.speak(u)
    }
    window.removeEventListener('click', prime)
  }
  window.addEventListener('click', prime)
  return () => window.removeEventListener('click', prime)
}, [])

  // Speech recognition setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SR()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('')
        setAnswer(transcript)
      }
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  // Fetch past sessions
  useEffect(() => { fetchSessions() }, [token])

  // Timer countdown
  useEffect(() => {
    if (!useTimer || !timerActive || timeLeft === null) return
    if (timeLeft <= 0) {
      setTimerActive(false)
      setAutoSubmit(true)
      return
    }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timerActive, timeLeft, useTimer])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (!autoSubmit) return
    setAutoSubmit(false)
    if (answerRef.current.trim()) {
      toast('⏰ Time up! Submitting your answer...')
      submitAnswer(answerRef.current)
    } else {
      toast.error('⏰ Time up! No answer provided.')
    }
  }, [autoSubmit])

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      setSessions(res.data.sessions || [])
    } catch {}
  }

  const startTimer = () => {
    if (useTimer) { setTimeLeft(timerDuration); setTimerActive(true) }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return toast.error('Speech recognition not supported in this browser')
    if (isListening) { recognitionRef.current.stop(); setIsListening(false) }
    else { recognitionRef.current.start(); setIsListening(true) }
  }

  const speakQuestion = (text) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const doSpeak = () => {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.9
      utter.volume = 1
      // pick first English voice if available
      const voices = window.speechSynthesis.getVoices()
      const engVoice = voices.find(v => v.lang.startsWith('en'))
      if (engVoice) utter.voice = engVoice
      utter.onstart = () => setIsSpeaking(true)
      utter.onend = () => setIsSpeaking(false)
      utter.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utter)
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      doSpeak()
    } else {
      // voices not loaded yet — wait for them
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        doSpeak()
      }
    }
  }

  const handleStart = async () => {
    if (!jobDescription.trim()) return toast.error('Please enter a job description')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/start`,
        { job_title: jobTitle, job_description: jobDescription, num_questions: numQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setQuestions(res.data.questions)
      setCvContext(res.data.cv_context || [])
      setPhase(PHASES.INTERVIEW)
      setCurrentQ(0)
      setAllScores([])
      setAllEvals([])
      setSessionSaved(false)
      setTimeout(() => { speakQuestion(res.data.questions[0]); startTimer() }, 500)
    } catch {
      toast.error('Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async (answerText) => {
    if (!answerText.trim()) return toast.error('Please provide an answer')
    if (isListening) { recognitionRef.current.stop(); setIsListening(false) }
    setTimerActive(false)
    setLoading(true)
    try {
      const res = await axios.post(`${API}/answer`,
        { question: questions[currentQ], answer: answerText, job_title: jobTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEvaluation(res.data)
      setAllScores(prev => [...prev, res.data.overall_score])
      setAllEvals(prev => [...prev, { question: questions[currentQ], answer: answerText, evaluation: res.data }])
    } catch {
      toast.error('Failed to evaluate answer')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = () => submitAnswer(answer)

  const handleRetry = () => {
    setEvaluation(null)
    setAnswer('')
    setAllScores(prev => prev.slice(0, -1))
    setAllEvals(prev => prev.slice(0, -1))
    if (useTimer) { setTimeLeft(timerDuration); setTimerActive(true) }
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setPhase(PHASES.DONE)
      saveSession()
    } else {
      const next = currentQ + 1
      setCurrentQ(next)
      setAnswer('')
      setEvaluation(null)
      setTimeout(() => { speakQuestion(questions[next]); startTimer() }, 300)
    }
  }

  const saveSession = async () => {
    if (sessionSaved) return
    try {
      const scores = allScores
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const level = avg >= 75 ? 'Ready' : avg >= 55 ? 'Almost Ready' : 'Needs Practice'
      await axios.post(`${API}/save`, {
        job_title: jobTitle,
        job_description: jobDescription,
        questions,
        evaluations: allEvals.map(e => e.evaluation),
        scores,
        overall_score: avg,
        readiness_level: level,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSessionSaved(true)
      fetchSessions()
    } catch {}
  }

  const handleExport = async (sessionId) => {
    try {
      const res = await axios.get(`${API}/export/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'interview_report.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
  const readinessLevel = avgScore >= 75 ? 'Ready' : avgScore >= 55 ? 'Almost Ready' : 'Needs Practice'
  const readinessColor = avgScore >= 75 ? 'text-green-600 dark:text-green-400' : avgScore >= 55 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const timerColor = timeLeft !== null && timeLeft <= 30
    ? 'text-red-600 dark:text-red-400' : timeLeft <= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'

  // ── SETUP ──
  if (phase === PHASES.SETUP) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Coach</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">AI-generated questions from your CV + the JD. Answer by text or voice.</p>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Job Title</label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-transparent"
                placeholder="e.g. Software Engineer" />
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Job Description</label>
              <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                rows={6} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none border border-gray-200 dark:border-transparent"
                placeholder="Paste the job description..." />
            </div>

            {/* Question count */}
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Number of Questions</label>
              <div className="flex gap-2">
                {[5, 7, 10].map(n => (
                  <button key={n} onClick={() => setNumQuestions(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      numQuestions === n ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >{n} Questions</button>
                ))}
              </div>
            </div>

            {/* Timer toggle */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-violet-600 dark:text-violet-400" />
                  <span className="text-sm text-gray-900 dark:text-white font-medium">Timer per question</span>
                </div>
                <button onClick={() => setUseTimer(p => !p)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${useTimer ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useTimer ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {useTimer && (
                <div className="flex gap-2">
                  {[60, 120, 180].map(d => (
                    <button key={d} onClick={() => setTimerDuration(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        timerDuration === d ? 'bg-violet-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >{d / 60} min</button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleStart} disabled={loading || !jobDescription.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Generating questions...' : 'Start Mock Interview'}
            </button>
          </div>

          {/* Past sessions */}
          {sessions.length > 0 && (
            <div className="mt-8">
              <button onClick={() => setShowSessions(p => !p)}
                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-3 transition"
              >
                <History size={14} />
                Past Sessions ({sessions.length})
                {showSessions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showSessions && (
                <div className="space-y-2">
                  {sessions.map(s => (
                    <div key={s.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.job_title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{s.created_at} · {s.questions_count} questions</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          s.overall_score >= 75 ? 'text-green-600 dark:text-green-400' : s.overall_score >= 55 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                        }`}>{s.overall_score}%</span>
                        <button onClick={() => handleExport(s.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          title="Export PDF"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── DONE ──
  if (phase === PHASES.DONE) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Interview Complete</h1>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Overall Readiness Score</p>
            <p className="text-5xl font-bold text-gray-900 dark:text-white">{avgScore}%</p>
            <p className={`text-lg font-semibold mt-2 ${readinessColor}`}>{readinessLevel}</p>
            <p className="text-xs text-gray-500 mt-1">{allEvals.length} questions answered</p>
          </div>

          <div className="space-y-4 mb-6">
            {allEvals.map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
                <p className="text-violet-600 dark:text-violet-400 text-xs font-semibold mb-1">Q{i + 1}</p>
                <p className="text-gray-900 dark:text-white text-sm font-medium mb-3">{item.question}</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {Object.entries(item.evaluation.star_scores).map(([key, val]) => (
                    <div key={key} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{key}</p>
                      <p className="text-gray-900 dark:text-white font-bold">{val.score}/10</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-900 dark:text-white mb-1">Score: <span className={
                  item.evaluation.overall_score >= 75 ? 'text-green-600 dark:text-green-400 font-bold' :
                  item.evaluation.overall_score >= 55 ? 'text-yellow-600 dark:text-yellow-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'
                }>{item.evaluation.overall_score}%</span></p>
                {item.evaluation.ideal_answer_hint && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs italic border-l-2 border-violet-500 pl-2 mt-2">
                    💡 {item.evaluation.ideal_answer_hint}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { if (sessions.length > 0) handleExport(sessions[0].id); else toast('Saving session, please wait...') }}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Download size={15} /> Export PDF
            </button>
            <button
              onClick={() => { setPhase(PHASES.SETUP); setEvaluation(null); setAnswer('') }}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition"
            >
              New Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── INTERVIEW ──
  return (
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Question {currentQ + 1} of {questions.length}
          </h1>
          <div className="flex items-center gap-3">
            {useTimer && timeLeft !== null && !evaluation && (
              <span className={`text-xl font-bold font-mono ${timerColor}`}>
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-gray-500 text-sm">{jobTitle}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mb-2">
          <div className="bg-violet-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(currentQ / questions.length) * 100}%` }} />
        </div>

        {/* Timer bar */}
        {useTimer && timeLeft !== null && !evaluation && (
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1 mb-4">
            <div
              className={`h-1 rounded-full transition-all ${
                timeLeft <= 30 ? 'bg-red-500' : timeLeft <= 60 ? 'bg-yellow-500' : 'bg-violet-500'
              }`}
              style={{ width: `${(timeLeft / timerDuration) * 100}%` }}
            />
          </div>
        )}

        {/* CV context toggle */}
        {cvContext.length > 0 && (
          <>
            <button onClick={() => setShowCVContext(p => !p)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 mb-2 transition"
            >
              {showCVContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              CV sections used to generate these questions
            </button>
            {showCVContext && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 space-y-2">
                {cvContext.slice(0, 2).map((chunk, i) => (
                  <p key={i} className="text-xs text-gray-500 leading-relaxed">{chunk.slice(0, 200)}...</p>
                ))}
              </div>
            )}
          </>
        )}

        {/* Question */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-gray-900 dark:text-white text-lg leading-relaxed">{questions[currentQ]}</p>
            <button onClick={() => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false) }
    else speakQuestion(questions[currentQ])
  }}
  className={`shrink-0 transition ${isSpeaking ? 'text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 animate-pulse' : 'text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300'}`}
  title={isSpeaking ? 'Click to stop' : 'Read aloud'}>
  <Volume2 size={18} />
</button>
          </div>
        </div>

        {/* Previous answers toggle */}
        {allEvals.length > 0 && (
          <>
            <button onClick={() => setShowPrevAnswers(p => !p)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 mb-2 transition"
            >
              {showPrevAnswers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Previous answers ({allEvals.length})
            </button>
            {showPrevAnswers && (
              <div className="space-y-2 mb-4">
                {allEvals.map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold">Q{i + 1}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.question}</p>
                    <p className="text-xs text-gray-900 dark:text-white mt-1">{item.answer}</p>
                    <p className="text-xs text-gray-500 mt-1">Score: {item.evaluation.overall_score}%</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Answer area */}
        {!evaluation && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-4">
            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm border border-gray-200 dark:border-transparent"
              placeholder="Type your answer, or use the microphone..." />
            <div className="flex gap-3">
              <button onClick={toggleListening}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isListening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Speak</>}
              </button>
              <button onClick={handleSubmitAnswer} disabled={loading || !answer.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Evaluating...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}

        {/* Evaluation */}
        {evaluation && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white font-semibold">Your Score</p>
              <p className={`text-2xl font-bold ${
                evaluation.overall_score >= 75 ? 'text-green-600 dark:text-green-400' :
                evaluation.overall_score >= 55 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`}>{evaluation.overall_score}%</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(evaluation.star_scores).map(([key, val]) => (
                <div key={key} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">{key}</p>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">{val.score}/10</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-snug">{val.feedback}</p>
                </div>
              ))}
            </div>

            {evaluation.strengths?.length > 0 && (
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-semibold mb-1">✓ Strengths</p>
                {evaluation.strengths.map((s, i) => <p key={i} className="text-gray-700 dark:text-gray-300 text-sm">• {s}</p>)}
              </div>
            )}

            {evaluation.improvements?.length > 0 && (
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold mb-1">↑ Improve</p>
                {evaluation.improvements.map((s, i) => <p key={i} className="text-gray-700 dark:text-gray-300 text-sm">• {s}</p>)}
              </div>
            )}

            {evaluation.ideal_answer_hint && (
              <p className="text-gray-500 dark:text-gray-400 text-xs italic border-l-2 border-violet-500 pl-3">
                💡 {evaluation.ideal_answer_hint}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={handleRetry}
                className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition flex items-center gap-2"
              >
                <RotateCcw size={13} /> Retry
              </button>
              <button onClick={handleNext}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {currentQ + 1 >= questions.length ? 'View Results' : 'Next Question →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}