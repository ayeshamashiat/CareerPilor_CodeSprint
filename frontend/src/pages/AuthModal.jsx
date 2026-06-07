import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../api/auth'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { X, Eye, EyeOff } from 'lucide-react'

export default function AuthModal({ defaultMode = 'login' }) {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState(defaultMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleClose = () => navigate('/')
  const switchMode = (next) => { setMode(next); setForm({ name: '', email: '', password: '' }); setShowPassword(false) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await loginUser({ email: form.email, password: form.password })
        setAuth({ name: res.data.name, email: res.data.email, id: res.data.user_id }, res.data.access_token)
        toast.success('Welcome back')
      } else {
        const res = await registerUser(form)
        setAuth({ name: res.data.name, email: res.data.email, id: res.data.user_id }, res.data.access_token)
        toast.success('Account created')
      }
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || (mode === 'login' ? 'Login failed' : 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const s = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      padding: '0 1rem',
    },
    card: {
      width: '100%', maxWidth: '440px',
      backgroundColor: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '16px',
      padding: '2rem',
      position: 'relative',
      boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      fontFamily: 'DM Sans, sans-serif',
    },
    closeBtn: {
      position: 'absolute', top: '1rem', right: '1rem',
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#6b7280', padding: '4px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    tabRow: {
      display: 'flex', gap: '4px',
      backgroundColor: '#1f2937',
      borderRadius: '10px', padding: '4px',
      marginBottom: '1.75rem',
    },
    tab: (active) => ({
      flex: 1, padding: '8px',
      fontSize: '0.875rem', fontWeight: 600,
      border: 'none', borderRadius: '8px', cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: active ? '#7c3aed' : 'transparent',
      color: active ? '#fff' : '#9ca3af',
      fontFamily: 'DM Sans, sans-serif',
    }),
    heading: {
      fontSize: '1.5rem', fontWeight: 700,
      color: '#fff', marginBottom: '4px',
      fontFamily: 'Syne, DM Sans, sans-serif',
    },
    subtext: {
      fontSize: '0.875rem', color: '#9ca3af',
      marginBottom: '1.5rem',
    },
    fieldWrap: { marginBottom: '1rem' },
    label: {
      display: 'block', fontSize: '0.75rem',
      color: '#9ca3af', marginBottom: '6px',
      fontFamily: 'DM Sans, sans-serif',
    },
    input: {
      width: '100%', backgroundColor: '#1f2937',
      border: '1px solid #374151', borderRadius: '8px',
      padding: '12px 16px', fontSize: '0.875rem',
      color: '#fff', outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'DM Sans, sans-serif',
    },
    submitBtn: (disabled) => ({
      width: '100%', backgroundColor: disabled ? '#5b21b6' : '#7c3aed',
      color: '#fff', border: 'none', borderRadius: '8px',
      padding: '12px', fontSize: '0.9375rem', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      marginTop: '0.5rem',
      transition: 'background 0.2s',
      fontFamily: 'DM Sans, sans-serif',
    }),
    footer: {
      fontSize: '0.75rem', color: '#6b7280',
      textAlign: 'center', marginTop: '1.25rem',
    },
    switchBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#a78bfa', fontSize: '0.75rem',
      fontFamily: 'DM Sans, sans-serif', padding: 0,
    },
    passwordWrap: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    eyeBtn: {
      position: 'absolute', right: '12px',
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#6b7280', padding: '4px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      lineHeight: 0,
    },
  }

  return (
    <div style={s.overlay} onClick={handleClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>

        <button style={s.closeBtn} onClick={handleClose}>
          <X size={18} />
        </button>

        {/* Tabs */}
        <div style={s.tabRow}>
          <button style={s.tab(mode === 'login')} onClick={() => switchMode('login')}>Sign in</button>
          <button style={s.tab(mode === 'register')} onClick={() => switchMode('register')}>Register</button>
        </div>

        <h1 style={s.heading}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p style={s.subtext}>
          {mode === 'login' ? 'Sign in to your CareerPilot account' : 'Start your career journey with CareerPilot'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={s.fieldWrap}>
              <label style={s.label}>Full Name</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} required
                placeholder="Your name" style={s.input}
              />
            </div>
          )}

          <div style={s.fieldWrap}>
            <label style={s.label}>Email</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} required
              placeholder="you@example.com" style={s.input}
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} required
                placeholder="••••••••" style={{ ...s.input, paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={s.submitBtn(loading)}>
            {loading
              ? mode === 'login' ? 'Signing in...' : 'Creating account...'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={s.footer}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={s.switchBtn} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  )
}