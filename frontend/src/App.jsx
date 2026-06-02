import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import CVUpload from './pages/CVUpload'
import FitScore from './pages/FitScore'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import TailorCV from './pages/TailorCV'
import InterviewCoach from './pages/InterviewCoach'
import JobHunter from './pages/JobHunter'
import Layout from './components/Layout'
import useAuthStore from './store/authStore'

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/cv-upload" element={<ProtectedRoute><CVUpload /></ProtectedRoute>} />
        <Route path="/fit-score" element={<ProtectedRoute><FitScore /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/tailor-cv" element={<ProtectedRoute><TailorCV /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><InterviewCoach /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobHunter /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}