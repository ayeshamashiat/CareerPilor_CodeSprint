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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cv-upload" element={<CVUpload />} />
        <Route path="/fit-score" element={<FitScore />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/tailor-cv" element={<TailorCV />} />
        <Route path="/interview" element={<InterviewCoach />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}