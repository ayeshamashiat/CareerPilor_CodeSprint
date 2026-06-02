import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'

const PHASES = { SETUP: 'setup', INTERVIEW: 'interview', DONE: 'done' }

export default function InterviewCoach() {
  const token = useAuthStore((s) => s.token)
  const [phase, setPhase] = useState(PHASES.SETUP)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [allScores, setAllScores] = useState([])
  const [allEvals, setAllEvals] = useState([])
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  // Web Speech API setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('')
        setAnswer(transcript)
      }
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return toast.error('Speech recognition not supported in this browser')
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.9
      window.speechSynthesis.speak(utter)
    }
  }

  const handleStart = async () => {
    if (!jobDescription.trim()) return toast.error('Please enter a job description')
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:8000/api/interview/start',
        { job_title: jobTitle, job_description: jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setQuestions(res.data.questions)
      setPhase(PHASES.INTERVIEW)
      setCurrentQ(0)
      setAllScores([])
      setAllEvals([])
      setTimeout(() => speakQuestion(res.data.questions[0]), 500)
    } catch (err) {
      toast.error('Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return toast.error('Please provide an answer')
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:8000/api/interview/answer',
        { question: questions[currentQ], answer, job_title: jobTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEvaluation(res.data)
      setAllScores((prev) => [...prev, res.data.overall_score])
      setAllEvals((prev) => [...prev, { question: questions[currentQ], answer, evaluation: res.data }])
    } catch (err) {
      toast.error('Failed to evaluate answer')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setPhase(PHASES.DONE)
    } else {
      setCurrentQ((prev) => prev + 1)
      setAnswer('')
      setEvaluation(null)
      setTimeout(() => speakQuestion(questions[currentQ + 1]), 300)
    }
  }

  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
  const readinessLevel = avgScore >= 75 ? 'Ready' : avgScore >= 55 ? 'Almost Ready' : 'Needs Practice'
  const readinessColor = avgScore >= 75 ? 'text-green-400' : avgScore >= 55 ? 'text-yellow-400' : 'text-red-400'

  if (phase === PHASES.SETUP) {
    return (
      <Layout>
        <div className="px-4 py-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Interview Coach</h1>
            <p className="text-gray-400 mb-8">AI-generated questions from your CV + the JD. Answer by text or voice.</p>

            <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Job Title</label>
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
                  placeholder="Paste the job description..."
                />
              </div>
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Generating questions...' : 'Start Mock Interview'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (phase === PHASES.DONE) {
    return (
      <Layout>
        <div className="px-4 py-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Interview Complete</h1>
            <div className="bg-gray-900 rounded-2xl p-6 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-1">Overall Readiness Score</p>
              <p className="text-5xl font-bold text-white">{avgScore}%</p>
              <p className={`text-lg font-semibold mt-2 ${readinessColor}`}>{readinessLevel}</p>
            </div>

            <div className="space-y-4">
              {allEvals.map((item, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl p-5">
                  <p className="text-violet-400 text-xs font-semibold mb-1">Q{i + 1}</p>
                  <p className="text-white text-sm font-medium mb-3">{item.question}</p>
                  <div className="flex gap-3 mb-3">
                    {Object.entries(item.evaluation.star_scores).map(([key, val]) => (
                      <div key={key} className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400 uppercase">{key}</p>
                        <p className="text-white font-bold">{val.score}/10</p>
                      </div>
                    ))}
                  </div>
                  {item.evaluation.ideal_answer_hint && (
                    <p className="text-gray-400 text-xs italic border-l-2 border-violet-500 pl-2">
                      {item.evaluation.ideal_answer_hint}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => { setPhase(PHASES.SETUP); setEvaluation(null); setAnswer('') }}
              className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Start New Session
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Question {currentQ + 1} of {questions.length}</h1>
            <span className="text-gray-400 text-sm">{jobTitle}</span>
          </div>

          {/* Progress */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQ) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-gray-900 rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-white text-lg leading-relaxed">{questions[currentQ]}</p>
              <button
                onClick={() => speakQuestion(questions[currentQ])}
                className="text-violet-400 hover:text-violet-300 shrink-0"
                title="Read question aloud"
              >
                🔊
              </button>
            </div>
          </div>

          {/* Answer area */}
          {!evaluation && (
            <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                placeholder="Type your answer here, or use the microphone below..."
              />
              <div className="flex gap-3">
                <button
                  onClick={toggleListening}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {isListening ? '⏹ Stop Recording' : '🎤 Speak Answer'}
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answer.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Evaluating...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}

          {/* Evaluation */}
          {evaluation && (
            <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">Your Score</p>
                <p className={`text-2xl font-bold ${
                  evaluation.overall_score >= 75 ? 'text-green-400' :
                  evaluation.overall_score >= 55 ? 'text-yellow-400' : 'text-red-400'
                }`}>{evaluation.overall_score}%</p>
              </div>

              {/* STAR breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(evaluation.star_scores).map(([key, val]) => (
                  <div key={key} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{key}</p>
                    <p className="text-white font-bold text-lg">{val.score}/10</p>
                    <p className="text-gray-400 text-xs mt-1 leading-snug">{val.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {evaluation.strengths?.length > 0 && (
                <div>
                  <p className="text-green-400 text-sm font-semibold mb-1">✓ Strengths</p>
                  {evaluation.strengths.map((s, i) => (
                    <p key={i} className="text-gray-300 text-sm">• {s}</p>
                  ))}
                </div>
              )}

              {/* Improvements */}
              {evaluation.improvements?.length > 0 && (
                <div>
                  <p className="text-yellow-400 text-sm font-semibold mb-1">↑ Improve</p>
                  {evaluation.improvements.map((s, i) => (
                    <p key={i} className="text-gray-300 text-sm">• {s}</p>
                  ))}
                </div>
              )}

              {evaluation.ideal_answer_hint && (
                <p className="text-gray-400 text-xs italic border-l-2 border-violet-500 pl-3">
                  💡 {evaluation.ideal_answer_hint}
                </p>
              )}

              <button
                onClick={handleNext}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition"
              >
                {currentQ + 1 >= questions.length ? 'View Final Results' : 'Next Question →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}