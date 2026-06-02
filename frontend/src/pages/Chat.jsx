import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'

const SESSION_ID = 'session_' + Math.random().toString(36).slice(2)

const QUICK_REPLIES = [
  'Am I ready for a data engineer role?',
  'Analyse the skill gaps in my CV',
  'Write me a cover letter for a software engineer role',
  'Give me a 3-month learning roadmap for machine learning',
]

export default function Chat() {
  const token = useAuthStore((s) => s.token)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm CareerPilot. I've read your CV and I'm ready to help. Ask me anything — cover letters, skill gaps, interview prep, or career roadmaps.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage) return

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(
        'http://localhost:8000/api/chat/message',
        { message: userMessage, session_id: SESSION_ID },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      toast.error('Failed to get response')
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">AI Career Assistant</h1>
          <p className="text-gray-400 text-sm">Powered by your CV — ask anything</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 py-2 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded-full border border-gray-700 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about your CV, cover letters, skill gaps..."
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 rounded-xl transition disabled:opacity-50 font-semibold text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}