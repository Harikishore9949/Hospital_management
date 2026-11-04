import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, Users, LogOut, Menu, X,
  LayoutDashboard, ClipboardList, User as UserIcon,
  Stethoscope, Microscope, Pill, ShieldCheck, HeartPulse,
  Search, Bell, AlertCircle, ChevronLeft, ChevronRight,
  Activity, Sparkles, ArrowLeft
} from 'lucide-react'
import { getUsername, clearAuth } from '../api'
import '../components/ui.css'
import '../components/dashboard.css'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  return <>{time.toLocaleTimeString('en-IN', { timeStyle: 'short' })}</>
}

// Master prompt role-based theme & accent mappings
const ROLE_THEMES = {
  DOCTOR: {
    accent: '#0EA5E9',
    icon: Stethoscope,
    label: 'Doctor',
    emoji: '👨‍⚕️',
  },
  LAB: {
    accent: '#06B6D4',
    icon: Microscope,
    label: 'Lab Technician',
    emoji: '🔬',
  },
  PHARMACY: {
    accent: '#10B981',
    icon: Pill,
    label: 'Pharmacist',
    emoji: '💊',
  },
  ADMIN: {
    accent: '#0369A1',
    icon: ShieldCheck,
    label: 'Administrator',
    emoji: '🛡️',
  },
  PATIENT: {
    accent: '#38BDF8',
    icon: ClipboardList,
    label: 'Patient',
    emoji: '🧑‍⚕️',
  },
}

export default function DashLayout({
  role,           // 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'LAB' | 'ADMIN'
  activeView,
  setActiveView,
  navItems,       // [{ id, label, icon }]
  topbarTitle,
  children,
}) {
  const navigate = useNavigate()
  const username = getUsername()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [historyStack, setHistoryStack] = useState([])
  const prevViewRef = useRef(activeView)

  // Track tab history
  useEffect(() => {
    if (prevViewRef.current && prevViewRef.current !== activeView) {
      const prev = prevViewRef.current
      setHistoryStack((stk) => [...stk, prev])
      // Push state to browser history so native back button doesn't leave the app
      window.history.pushState({ internalTab: activeView }, '', window.location.pathname)
    }
    prevViewRef.current = activeView
  }, [activeView])

  // Intercept browser back button (popstate) to return to previous tab
  useEffect(() => {
    function handlePopState(e) {
      if (historyStack.length > 0) {
        const prev = historyStack[historyStack.length - 1]
        setHistoryStack((stk) => stk.slice(0, -1))
        prevViewRef.current = prev
        setActiveView(prev)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [historyStack, setActiveView])

  function handleBack() {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1]
      setHistoryStack((stk) => stk.slice(0, -1))
      prevViewRef.current = prev
      setActiveView(prev)
    } else {
      const defaultTab = navItems[0]?.id || 'overview'
      if (activeView !== defaultTab) {
        setActiveView(defaultTab)
      } else {
        navigate(-1)
      }
    }
  }

  const theme = ROLE_THEMES[role] || {
    accent: '#0EA5E9',
    icon: Activity,
    label: role || 'Member',
    emoji: '👤',
  }
  const RoleIcon = theme.icon

  function handleLogout() {
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div
      className={`dash-layout ${collapsed ? 'sidebar-collapsed-layout' : ''}`}
      style={{ '--role-accent': theme.accent }}
    >
      {/* ── Clean Clinical Sky Background Layer (No photos or unwanted signs) ── */}
      <div className="dash-bg-layer" />
      <div className="dash-bg-overlay" />

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
        />
      )}

      {/* ── Left Sidebar (260px, Collapsible to 72px) ── */}
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        {/* Logo with Animated ECG Heartbeat Line */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ backgroundColor: theme.accent }}>
            <svg className="ecg-svg" viewBox="0 0 48 32">
              <path className="ecg-path" d="M0,16 L12,16 L16,4 L22,28 L28,10 L32,20 L36,16 L48,16" />
            </svg>
          </div>
          <div className="sidebar-brand">
            MediCare
            <span>Hospital Portal</span>
          </div>
        </div>

        {/* Role Badge Chip */}
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ borderColor: theme.accent }}>
            <RoleIcon size={18} style={{ color: theme.accent }} />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{username || 'User'}</div>
            <span
              className={`role-chip ${role?.toLowerCase()}`}
              style={{
                color: theme.accent,
                borderColor: `${theme.accent}40`,
                backgroundColor: `${theme.accent}15`,
              }}
            >
              {theme.label}
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="sidebar-nav">
          <div className="nav-section">Clinical Menu</div>
          {navItems.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveView(item.id)
                  setMobileOpen(false)
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}

          <div className="nav-section" style={{ marginTop: 12 }}>
            Account
          </div>
          <button
            className={`nav-btn ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('profile')
              setMobileOpen(false)
            }}
            title={collapsed ? 'My Profile' : undefined}
          >
            <span className="nav-icon">
              <UserIcon size={17} />
            </span>
            <span>My Profile</span>
          </button>
        </div>

        {/* Sidebar Footer with Sign Out */}
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ── Main Dashboard Content ── */}
      <div className="dash-main">
        {/* Top Navbar (64px, White Frosted Glass) */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Back button */}
            <button
              className="topbar-back-btn"
              onClick={handleBack}
              title="Go back to previous page or tab"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.82rem',
                color: 'var(--text-800)',
                background: '#ffffff',
                border: '1.5px solid var(--sky-200)',
                boxShadow: '0 2px 6px rgba(14,165,233,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginRight: 6,
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            {/* Mobile toggle */}
            <button
              className="topbar-collapse-btn"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle mobile drawer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop collapse 260px <-> 72px */}
            <button
              className="topbar-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (72px)'}
              aria-label="Collapse sidebar"
              style={{ display: window.innerWidth <= 900 ? 'none' : 'flex' }}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <span className="topbar-title">{topbarTitle}</span>
          </div>

          {/* Global Clinical Search Bar */}
          <div className="topbar-search">
            <Search size={16} className="topbar-search-icon" />
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search patients, records, vitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Topbar Right Controls */}
          <div className="topbar-right">
            {/* Live Clock with Tabular Numbers */}
            <div className="time-chip">
              <Clock size={13} style={{ color: 'var(--sky-600)' }} />
              <LiveClock />
            </div>

            {/* Notification Bell with Badge & Shake Animation on hover */}
            <button
              className="btn-icon-round bell-btn"
              aria-label="Notifications"
              title="Recent Notifications"
            >
              <Bell size={18} />
            </button>

            {/* Emergency SOS Button with Soft Red Pulse Ring */}
            <button
              className="btn-emergency"
              onClick={() => {
                // If on Doctor or Patient, switch to emergency or notify
                if (navItems.some((n) => n.id === 'emergency')) {
                  setActiveView('emergency')
                } else {
                  alert('Emergency Hotline: 108 / +91-800-EMERGENCY connected.')
                }
              }}
              title="Emergency SOS Response"
            >
              <AlertCircle size={16} />
              <span>EMERGENCY</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="page-content animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  )
}
