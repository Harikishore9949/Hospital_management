import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { apiLogin, apiRegister } from '../api'
import '../components/ui.css'
import './AuthPage.css'

/* ── Alert ─────────────────────────────────────────────── */
function Alert({ type, msg }) {
  if (!msg) return null
  const icon = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type]
  return (
    <div className={`alert alert-${type}`}>
      <span>{icon}</span><span>{msg}</span>
    </div>
  )
}

/* ── Login form ──────────────────────────────────────────── */
function LoginForm({ onSwitch }) {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!form.username.trim() || !form.password) {
      setAlert({ type: 'warning', msg: 'Please fill in both fields.' }); return
    }
    setLoading(true)
    try {
      const data = await apiLogin(form.username.trim(), form.password)
      setAlert({ type: 'success', msg: `Welcome back, ${data.username}! Redirecting…` })
      const routes = { DOCTOR: '/doctor', PATIENT: '/patient', PHARMACY: '/pharmacy', LAB: '/lab', ADMIN: '/admin' }
      setTimeout(() => navigate(routes[data.role] || '/', { replace: true }), 900)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Invalid credentials. Please try again.' })
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="auth-logo-center">
        <div className="auth-logo-ring">
          <svg className="ecg-svg" viewBox="0 0 48 32" style={{ width: 34, height: 24, strokeWidth: 2.5 }}>
            <path className="ecg-path" d="M0,16 L12,16 L16,4 L22,28 L28,10 L32,20 L36,16 L48,16" />
          </svg>
        </div>
        <h2 className="auth-card-title">MediCare Portal</h2>
        <p className="auth-card-sub">Hospital Management & Virtual Care Portal</p>
      </div>

      <Alert {...(alert || {})} msg={alert?.msg} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-wrap">
            <span className="input-icon"><User size={15} /></span>
            <input
              id="login-username"
              className="form-input"
              type="text"
              placeholder="Username"
              autoComplete="username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-wrap">
            <span className="input-icon"><Lock size={15} /></span>
            <input
              id="login-password"
              className="form-input"
              type={showPwd ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button type="button" className="input-eye" onClick={() => setShowPwd(s => !s)} aria-label="Toggle password">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="auth-meta-row">
          <label className="auth-remember">
            <input type="checkbox" /> Remember me
          </label>
          <button type="button" className="auth-forgot">Forgot Password?</button>
        </div>

        <button id="login-btn" type="submit" className="btn-auth-primary" disabled={loading}>
          {loading ? <><span className="btn-spinner" /> Signing in…</> : 'Sign In to Portal'}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-icon">✦</span>
      </div>

      <div className="auth-toggle">
        New patient? <button onClick={onSwitch}>Create an account</button>
      </div>
    </>
  )
}

/* ── Register form ───────────────────────────────────────── */
function RegisterForm({ onSwitch }) {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!form.username.trim()) { setAlert({ type: 'warning', msg: 'Please enter a username.' }); return }
    if (form.password.length < 6) { setAlert({ type: 'warning', msg: 'Password must be at least 6 characters.' }); return }
    setLoading(true)
    try {
      await apiRegister(form.username.trim(), form.password, 'PATIENT')
      setAlert({ type: 'success', msg: 'Patient account created! You can now sign in.' })
      setTimeout(onSwitch, 1600)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Registration failed. Username may already exist.' })
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="auth-logo-center">
        <div className="auth-logo-ring">
          <svg className="ecg-svg" viewBox="0 0 48 32" style={{ width: 34, height: 24, strokeWidth: 2.5 }}>
            <path className="ecg-path" d="M0,16 L12,16 L16,4 L22,28 L28,10 L32,20 L36,16 L48,16" />
          </svg>
        </div>
        <h2 className="auth-card-title">Patient Registration</h2>
        <p className="auth-card-sub">Join the MediCare platform as a Patient</p>
      </div>

      <Alert {...(alert || {})} msg={alert?.msg} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-wrap">
            <span className="input-icon"><User size={15} /></span>
            <input
              id="reg-username"
              className="form-input"
              type="text"
              placeholder="Choose a username"
              autoComplete="username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-wrap">
            <span className="input-icon"><Lock size={15} /></span>
            <input
              id="reg-password"
              className="form-input"
              type={showPwd ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button type="button" className="input-eye" onClick={() => setShowPwd(s => !s)} aria-label="Toggle password">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
          ℹ️ <strong>Role: Patient</strong><br />
          Doctor and Pharmacy accounts cannot be registered publicly. They are created exclusively by the System Admin.
        </div>

        <button id="reg-btn" type="submit" className="btn-auth-primary" disabled={loading}>
          {loading ? <><span className="btn-spinner" /> Creating account…</> : 'Create Patient Account →'}
        </button>
      </form>

      <div className="auth-toggle" style={{ marginTop: 18 }}>
        Already have an account? <button onClick={onSwitch}>Sign in →</button>
      </div>
    </>
  )
}

/* ── AuthPage ────────────────────────────────────────────── */
export default function AuthPage() {
  const [tab, setTab] = useState('login')

  return (
    <div className="auth-page">
      {/* Floating leaves */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="auth-leaf" />
      ))}

      {/* Centered card */}
      <div className="auth-card-wrapper">
        {/* Tab switch */}
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        <div className="auth-card">
          {tab === 'login'
            ? <LoginForm    onSwitch={() => setTab('register')} />
            : <RegisterForm onSwitch={() => setTab('login')} />}
        </div>
      </div>
    </div>
  )
}
