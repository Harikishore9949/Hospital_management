import { Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated, getRole } from './api'
import AuthPage    from './pages/AuthPage'
import DoctorDash  from './pages/DoctorDash'
import PatientDash from './pages/PatientDash'
import PharmacyDash from './pages/PharmacyDash'
import LabDash      from './pages/LabDash'
import AdminDash   from './pages/AdminDash'
import VideoRoom   from './pages/VideoRoom'

// Protected route — redirects to / if not authenticated or wrong role
function ProtectedRoute({ role, children }) {
  if (!isAuthenticated()) return <Navigate to="/" replace />
  if (role && getRole() !== role) return <Navigate to="/" replace />
  return children
}

// Video room protection — requires any authenticated user
function AuthRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<AuthPage />} />
      <Route path="/doctor"         element={<ProtectedRoute role="DOCTOR"><DoctorDash /></ProtectedRoute>} />
      <Route path="/patient"        element={<ProtectedRoute role="PATIENT"><PatientDash /></ProtectedRoute>} />
      <Route path="/pharmacy"       element={<ProtectedRoute role="PHARMACY"><PharmacyDash /></ProtectedRoute>} />
      <Route path="/lab"            element={<ProtectedRoute role="LAB"><LabDash /></ProtectedRoute>} />
      <Route path="/admin"          element={<ProtectedRoute role="ADMIN"><AdminDash /></ProtectedRoute>} />
      {/* Video consultation room — accessible to any authenticated user (role checked server-side) */}
      <Route path="/session/:roomId" element={<AuthRoute><VideoRoom /></AuthRoute>} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  )
}

