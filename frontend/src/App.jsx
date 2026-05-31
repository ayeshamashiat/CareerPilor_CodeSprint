import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import CVUpload from './pages/CVUpload'
import useAuthStore from './store/authStore'
import FitScore from './pages/FitScore'
import Dashboard from './pages/Dashboard'


function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cv-upload" element={
          <ProtectedRoute>
            <CVUpload />
          </ProtectedRoute>
        } />
        <Route path="/fit-score" element={
  <ProtectedRoute>
    <FitScore />
  </ProtectedRoute>
} />
        <Route path="/dashboard" element={
            <Dashboard />
          
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}