import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Stethoscope, Activity, Newspaper, Siren, Trash2,
  RefreshCw, Shield, LogOut, Search, ChevronRight, X,
  BarChart2, AlertTriangle, Plus, Package, UserPlus, FlaskConical,
  Bed, Building2, CheckCircle2, Clock, ArrowLeft
} from 'lucide-react'
import {
  getUsername, clearAuth,
  apiAdminGetStats, apiAdminGetDoctors, apiAdminCreateDoctor, apiAdminDeleteDoctor,
  apiAdminGetPharmacies, apiAdminCreatePharmacy, apiAdminDeletePharmacy,
  apiAdminGetLabs, apiAdminCreateLab, apiAdminDeleteLab,
  apiAdminGetPatients, apiGetArticles,
  apiAdminGetHospitalBeds, apiAdminGetBedRequests, apiAdminAcceptBedRequest, apiAdminRejectBedRequest, apiAdminUpdateBedStatus
} from '../api'
import '../components/ui.css'
import '../components/dashboard.css'

/* ── Stat card ─────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'Outfit,sans-serif', color: '#111', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

/* ── Delete confirm modal ───────────────────────── */
function DeleteConfirmModal({ title, name, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, padding: '28px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>Delete {title}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>This action cannot be undone</div>
          </div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.6 }}>
          You are about to permanently delete <strong>{name}</strong> and revoke access.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            {loading ? <><span className="btn-spinner" /> Deleting…</> : <><Trash2 size={15} /> Yes, Delete</>}
          </button>
          <button onClick={onCancel} style={{ padding: '11px 20px', background: '#f3f4f6', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Create User Modal ───────────────────────────── */
function CreateUserModal({ roleType, onSave, onClose, loading }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const isDoctor = roleType === 'DOCTOR'
  const isLab = roleType === 'LAB'

  function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (!username.trim()) { setErr('Username or Email is required.'); return }
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return }
    onSave(username.trim(), password.trim())
  }

  const roleTitle = isDoctor ? 'Doctor' : isLab ? 'Lab Center' : 'Pharmacy'
  const roleGradient = isDoctor
    ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
    : isLab
    ? 'linear-gradient(135deg,#0284c7,#0369a1)'
    : 'linear-gradient(135deg,#7c3aed,#6d28d9)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, padding: '28px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: roleGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {isDoctor ? <Stethoscope size={20} /> : isLab ? <FlaskConical size={20} /> : <Package size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111' }}>
                Issue New {roleTitle} Account
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                Admin provisioning for {roleTitle}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={16} /></button>
        </div>

        {err && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.84rem', color: '#991b1b' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{roleTitle} Username / Terminal ID *</label>
            <input
              className="form-input"
              style={{ background: '#fff', color: '#111', border: '1.5px solid #e5e7eb' }}
              placeholder={isDoctor ? "e.g. Dr. Ravella or ravella@hospital.com" : isLab ? "e.g. central_lab or apex_diagnostics" : "e.g. pharma_central or pharma@medicare.com"}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default / Initial Password *</label>
            <input
              className="form-input"
              type="text"
              style={{ background: '#fff', color: '#111', border: '1.5px solid #e5e7eb' }}
              placeholder="Min. 6 characters (e.g. lab123456)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4, display: 'block' }}>
              The {roleTitle.toLowerCase()} can change their username and password after signing in.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, background: roleGradient }}
            >
              {loading ? <><span className="btn-spinner" /> Creating Account…</> : `Issue ${roleTitle} Account`}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '11px 18px', background: '#f3f4f6', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Admin Dashboard ────────────────────────────── */
export default function AdminDash() {
  const navigate = useNavigate()
  const [view, setView] = useState('overview')
  const [stats, setStats] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [labs, setLabs] = useState([])
  const [patients, setPatients] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'DOCTOR'|'PHARMACY'|'LAB', data: obj }
  const [deleting, setDeleting] = useState(false)
  const [createRoleModal, setCreateRoleModal] = useState(null) // 'DOCTOR' | 'PHARMACY' | 'LAB'
  const [creatingUser, setCreatingUser] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [historyStack, setHistoryStack] = useState([])
  const prevViewRef = useRef(view)

  useEffect(() => {
    if (prevViewRef.current && prevViewRef.current !== view) {
      const prev = prevViewRef.current
      setHistoryStack((stk) => [...stk, prev])
      window.history.pushState({ internalAdminView: view }, '', window.location.pathname)
    }
    prevViewRef.current = view
  }, [view])

  useEffect(() => {
    function handlePopState(e) {
      if (historyStack.length > 0) {
        const prev = historyStack[historyStack.length - 1]
        setHistoryStack((stk) => stk.slice(0, -1))
        prevViewRef.current = prev
        setView(prev)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [historyStack])

  function handleBack() {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1]
      setHistoryStack((stk) => stk.slice(0, -1))
      prevViewRef.current = prev
      setView(prev)
    } else {
      if (view !== 'overview') {
        setView('overview')
      } else {
        navigate(-1)
      }
    }
  }

  const loadStats = useCallback(async () => {
    try { setStats(await apiAdminGetStats()) } catch (_) {}
  }, [])

  const loadDoctors = useCallback(async () => {
    setLoading(true)
    try { setDoctors(await apiAdminGetDoctors() || []) }
    catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  const loadPharmacies = useCallback(async () => {
    setLoading(true)
    try { setPharmacies(await apiAdminGetPharmacies() || []) }
    catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  const loadLabs = useCallback(async () => {
    setLoading(true)
    try { setLabs(await apiAdminGetLabs() || []) }
    catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  const loadPatients = useCallback(async () => {
    setLoading(true)
    try { setPatients(await apiAdminGetPatients() || []) }
    catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try { setArticles(await apiGetArticles('') || []) }
    catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadStats()
    loadDoctors()
  }, [loadStats, loadDoctors])

  useEffect(() => {
    if (view === 'pharmacies') loadPharmacies()
    if (view === 'labs') loadLabs()
    if (view === 'patients') loadPatients()
    if (view === 'articles') loadArticles()
  }, [view, loadPharmacies, loadLabs, loadPatients, loadArticles])

  async function handleCreateUser(username, password) {
    setCreatingUser(true)
    try {
      if (createRoleModal === 'DOCTOR') {
        const doc = await apiAdminCreateDoctor(username, password)
        setAlert({ type: 'success', msg: `✅ Doctor account "${doc.username}" created successfully!` })
        loadDoctors()
      } else if (createRoleModal === 'PHARMACY') {
        const ph = await apiAdminCreatePharmacy(username, password)
        setAlert({ type: 'success', msg: `✅ Pharmacy account "${ph.username}" created successfully!` })
        loadPharmacies()
      } else if (createRoleModal === 'LAB') {
        const lb = await apiAdminCreateLab(username, password)
        setAlert({ type: 'success', msg: `✅ Lab Center account "${lb.username}" issued successfully!` })
        loadLabs()
      }
      setCreateRoleModal(null)
      loadStats()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to create user.' })
    } finally { setCreatingUser(false) }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.type === 'DOCTOR') {
        await apiAdminDeleteDoctor(deleteTarget.data.id)
        setDoctors(prev => prev.filter(d => d.id !== deleteTarget.data.id))
        setAlert({ type: 'success', msg: `✅ Dr. ${deleteTarget.data.username} deleted successfully.` })
      } else if (deleteTarget.type === 'PHARMACY') {
        await apiAdminDeletePharmacy(deleteTarget.data.id)
        setPharmacies(prev => prev.filter(p => p.id !== deleteTarget.data.id))
        setAlert({ type: 'success', msg: `✅ Pharmacy user "${deleteTarget.data.username}" deleted successfully.` })
      } else if (deleteTarget.type === 'LAB') {
        await apiAdminDeleteLab(deleteTarget.data.id)
        setLabs(prev => prev.filter(l => l.id !== deleteTarget.data.id))
        setAlert({ type: 'success', msg: `✅ Lab Center "${deleteTarget.data.username}" deleted successfully.` })
      }
      setDeleteTarget(null)
      loadStats()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Delete failed.' })
    } finally { setDeleting(false) }
  }

  const filteredDoctors = doctors.filter(d =>
    d.username?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredPharmacies = pharmacies.filter(p =>
    p.username?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredLabs = labs.filter(l =>
    l.username?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredPatients = patients.filter(p =>
    p.username?.toLowerCase().includes(search.toLowerCase())
  )

  const navItems = [
    { id: 'overview',   label: 'Overview',                  icon: <BarChart2 size={16} /> },
    { id: 'doctors',    label: 'Manage Doctors',            icon: <Stethoscope size={16} /> },
    { id: 'labs',       label: 'Manage Labs',               icon: <FlaskConical size={16} /> },
    { id: 'pharmacies', label: 'Manage Pharmacy',           icon: <Package size={16} /> },
    { id: 'beds',       label: 'Hospital Beds & Inpatient', icon: <Bed size={16} /> },
    { id: 'patients',   label: 'All Patients',              icon: <Users size={16} /> },
    { id: 'articles',   label: 'All Articles',              icon: <Newspaper size={16} /> },
  ]

  return (
    <div className="dash-layout">
      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.type === 'DOCTOR' ? `Doctor (Dr. ${deleteTarget.data.username})` : `Pharmacy Staff (${deleteTarget.data.username})`}
          name={deleteTarget.data.username}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Create User Modal */}
      {createRoleModal && (
        <CreateUserModal
          roleType={createRoleModal}
          onSave={handleCreateUser}
          onClose={() => setCreateRoleModal(null)}
          loading={creatingUser}
        />
      )}

      {/* Sidebar overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 99 }} />}

      {/* ── Sidebar ── */}
      <nav className={`sidebar${sidebarOpen ? ' open' : ''}`} style={{
        background: '#ffffff',
        borderRight: '1.5px solid #bae6fd',
        boxShadow: '0 4px 24px rgba(2,132,199,0.08)'
      }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, width: 36, height: 36 }}>🛡️</div>
          <div className="sidebar-brand" style={{ color: '#0f172a' }}>MediCare <span style={{ color: '#0284c7', fontWeight: 700 }}>Admin Panel</span></div>
        </div>

        <div className="sidebar-user" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div className="sidebar-avatar" style={{ background: '#e0f2fe', color: '#0369a1' }}>👤</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name" style={{ color: '#0f172a', fontWeight: 700 }}>{getUsername()}</div>
            <span className="role-chip" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 800 }}>ADMIN</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section" style={{ color: '#0369a1', fontWeight: 800 }}>Administration</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-btn${view === item.id ? ' active' : ''}`}
              style={{
                color: view === item.id ? '#0284c7' : '#1e293b',
                background: view === item.id ? '#e0f2fe' : 'transparent',
                fontWeight: view === item.id ? 700 : 500
              }}
              onClick={() => { setView(item.id); setSidebarOpen(false); setSearch(''); setAlert(null) }}>
              <span className="nav-icon" style={{ color: view === item.id ? '#0284c7' : '#475569' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={() => { clearAuth(); navigate('/', { replace: true }) }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="dash-main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleBack}
              title="Go back to previous tab/page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.82rem',
                color: '#0f172a',
                background: '#ffffff',
                border: '1.5px solid #bae6fd',
                boxShadow: '0 2px 6px rgba(14,165,233,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-neutral-600)', display: 'flex', padding: 4 }}>
              ☰
            </button>
            <span className="topbar-title">
              {navItems.find(n => n.id === view)?.label || 'Admin'}
            </span>
          </div>
          <div className="topbar-right">
            <div className="time-chip"><Shield size={12} /> Admin</div>
            <div className="time-chip">👤 {getUsername()}</div>
          </div>
        </header>

        <div className="page-content">
          {alert && (
            <div style={{ padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontSize: '0.86rem',
              background: alert.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: alert.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${alert.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
            }} onClick={() => setAlert(null)}>
              <span>{alert.msg}</span><X size={14} />
            </div>
          )}

          {/* ─── Overview ─── */}
          {view === 'overview' && (
            <div className="view-section">
              <div className="page-header">
                <div>
                  <h2 className="page-header-title">🛡️ Admin Overview</h2>
                  <p className="page-header-sub">Hospital management system summary</p>
                </div>
                <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={loadStats}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard icon={<Stethoscope size={22} color="#fff" />} label="Total Doctors" value={stats?.doctors} color="linear-gradient(135deg,#2563eb,#1d4ed8)" />
                <StatCard icon={<FlaskConical size={22} color="#fff" />} label="Lab Centers" value={stats?.labs ?? 0} color="linear-gradient(135deg,#0284c7,#0369a1)" />
                <StatCard icon={<Package size={22} color="#fff" />} label="Pharmacies" value={stats?.pharmacies ?? 0} color="linear-gradient(135deg,#7c3aed,#6d28d9)" />
                <StatCard icon={<Users size={22} color="#fff" />} label="Total Patients" value={stats?.patients} color="linear-gradient(135deg,#16a34a,#15803d)" />
                <StatCard icon={<Activity size={22} color="#fff" />} label="Appointments" value={stats?.appointments} color="linear-gradient(135deg,#e11d48,#be123c)" />
                <StatCard icon={<Newspaper size={22} color="#fff" />} label="Published Articles" value={stats?.articles} color="linear-gradient(135deg,#0891b2,#0e7490)" />
                <StatCard icon={<Siren size={22} color="#fff" />} label="Open Emergencies" value={stats?.emergencies} color="linear-gradient(135deg,#dc2626,#991b1b)" />
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Stethoscope size={15} /> Quick Actions</div>
                </div>
                <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => setView('doctors')}>
                    <Stethoscope size={13} /> Manage Doctors <ChevronRight size={13} />
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={() => setView('labs')}>
                    <FlaskConical size={13} /> Manage Lab Centers <ChevronRight size={13} />
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={() => setView('pharmacies')}>
                    <Package size={13} /> Manage Pharmacy <ChevronRight size={13} />
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={() => setView('patients')}>
                    <Users size={13} /> View All Patients <ChevronRight size={13} />
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={() => setView('articles')}>
                    <Newspaper size={13} /> Browse Articles <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Manage Doctors ─── */}
          {view === 'doctors' && (
            <div className="view-section">
              <div className="page-header">
                <div>
                  <h2 className="page-header-title">👨‍⚕️ Manage Doctors</h2>
                  <p className="page-header-sub">{doctors.length} registered doctor(s). Only Admin can provision or delete Doctor accounts.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary btn-sm" style={{ width: 'auto', gap: 6 }} onClick={() => setCreateRoleModal('DOCTOR')}>
                    <Plus size={14} /> Provision New Doctor
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={loadDoctors} disabled={loading}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 40, background: '#fff', color: '#111', border: '1.5px solid #e5e7eb' }}
                  placeholder="Search doctors by username…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loading
                ? <div className="page-spinner"><span className="spinner" /> Loading doctors…</div>
                : filteredDoctors.length === 0
                  ? <div className="card"><div className="card-body"><div className="empty-state">
                      <div className="empty-icon">👨‍⚕️</div>
                      <div className="empty-title">No doctors found</div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: 'auto' }} onClick={() => setCreateRoleModal('DOCTOR')}>
                        <Plus size={14} /> Provision First Doctor
                      </button>
                    </div></div></div>
                  : (
                    <div className="card">
                      <div className="card-body" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)', borderBottom: '2px solid #e5e7eb' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username / Email</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDoctors.map((doc, i) => (
                              <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👨‍⚕️</div>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>Dr. {doc.username}</div>
                                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>ID: {doc.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ background: 'rgba(37,99,235,0.1)', color: '#1d4ed8', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>DOCTOR</span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => setDeleteTarget({ type: 'DOCTOR', data: doc })}
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
              }
            </div>
          )}

          {/* ─── Manage Pharmacy ─── */}
          {view === 'pharmacies' && (
            <div className="view-section">
              <div className="page-header">
                <div>
                  <h2 className="page-header-title">💊 Manage Pharmacy Accounts</h2>
                  <p className="page-header-sub">{pharmacies.length} pharmacy account(s). Only Admin can provision or delete Pharmacy staff accounts.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary btn-sm" style={{ width: 'auto', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', gap: 6 }} onClick={() => setCreateRoleModal('PHARMACY')}>
                    <Plus size={14} /> Provision Pharmacy Staff
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={loadPharmacies} disabled={loading}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 40, background: '#fff', color: '#111', border: '1.5px solid #e5e7eb' }}
                  placeholder="Search pharmacy accounts by username…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loading
                ? <div className="page-spinner"><span className="spinner" /> Loading pharmacy staff…</div>
                : filteredPharmacies.length === 0
                  ? <div className="card"><div className="card-body"><div className="empty-state">
                      <div className="empty-icon">💊</div>
                      <div className="empty-title">No pharmacy accounts found</div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: 'auto', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }} onClick={() => setCreateRoleModal('PHARMACY')}>
                        <Plus size={14} /> Provision First Pharmacy Account
                      </button>
                    </div></div></div>
                  : (
                    <div className="card">
                      <div className="card-body" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)', borderBottom: '2px solid #e5e7eb' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username / Email</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPharmacies.map((ph, i) => (
                              <tr key={ph.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>💊</div>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{ph.username}</div>
                                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>ID: {ph.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>PHARMACY</span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => setDeleteTarget({ type: 'PHARMACY', data: ph })}
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
              }
            </div>
          )}

          {/* ─── Manage Lab Centers ─── */}
          {view === 'labs' && (
            <div className="view-section">
              <div className="page-header">
                <div>
                  <h2 className="page-header-title">🔬 Manage Diagnostic Lab Centers</h2>
                  <p className="page-header-sub">{labs.length} authorized lab center(s). Only Admin can issue or delete Lab Center accounts. Once logged in, lab centers can update their username and password.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary btn-sm" style={{ width: 'auto', gap: 6, background: 'linear-gradient(135deg,#0284c7,#0369a1)' }} onClick={() => setCreateRoleModal('LAB')}>
                    <Plus size={14} /> Issue New Lab Center
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={loadLabs} disabled={loading}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 40, background: '#fff', color: '#111', border: '1.5px solid #e5e7eb' }}
                  placeholder="Search lab centers by username…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loading
                ? <div className="page-spinner"><span className="spinner" /> Loading laboratory centers…</div>
                : filteredLabs.length === 0
                  ? <div className="card"><div className="card-body"><div className="empty-state">
                      <div className="empty-icon">🔬</div>
                      <div className="empty-title">No diagnostic lab centers found</div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: 'auto', background: 'linear-gradient(135deg,#0284c7,#0369a1)' }} onClick={() => setCreateRoleModal('LAB')}>
                        <Plus size={14} /> Issue First Lab Center
                      </button>
                    </div></div></div>
                  : (
                    <div className="card">
                      <div className="card-body" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)', borderBottom: '2px solid #e5e7eb' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lab Center Username / Terminal</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLabs.map((lb, i) => (
                              <tr key={lb.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🔬</div>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{lb.username}</div>
                                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>ID: {lb.id} • Authorized Center</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>LAB</span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => setDeleteTarget({ type: 'LAB', data: lb })}
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                                  >
                                    <Trash2 size={13} /> Delete Center
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
              }
            </div>
          )}

          {/* ─── All Patients ─── */}
          {view === 'patients' && (
            <div className="view-section">
              <div className="page-header">
                <div>
                  <h2 className="page-header-title">🧑‍🤝‍🧑 All Patients</h2>
                  <p className="page-header-sub">{patients.length} registered patient(s)</p>
                </div>
                <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={loadPatients} disabled={loading}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="form-input" style={{ paddingLeft: 40, background: '#fff', color: '#111', border: '1.5px solid #e5e7eb' }}
                  placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {loading
                ? <div className="page-spinner"><span className="spinner" /> Loading patients…</div>
                : (
                  <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Username</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPatients.map((p, i) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                              onMouseLeave={e => e.currentTarget.style.background = ''}>
                              <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                              <td style={{ padding: '13px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🧑</div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>{p.username}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>ID: {p.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '13px 16px' }}>
                                <span style={{ background: 'rgba(22,163,74,0.1)', color: '#15803d', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>PATIENT</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              }
            </div>
          )}

          {/* ─── All Articles ─── */}
          {view === 'articles' && (
            <div className="view-section">
              <div className="page-header">
                <div>
                  <h2 className="page-header-title">📰 All Published Articles</h2>
                  <p className="page-header-sub">{articles.length} article(s) published by doctors</p>
                </div>
                <button className="btn btn-outline btn-sm" style={{ width: 'auto' }} onClick={loadArticles} disabled={loading}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              {loading
                ? <div className="page-spinner"><span className="spinner" /> Loading articles…</div>
                : articles.length === 0
                  ? <div className="card"><div className="card-body"><div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <div className="empty-title">No articles published yet</div>
                    </div></div></div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {articles.map(art => (
                        <div key={art.id} className="card" style={{ display: 'flex', overflow: 'hidden' }}>
                          {art.coverImageBase64 && <img src={art.coverImageBase64} alt="cover" style={{ width: 130, objectFit: 'cover', flexShrink: 0 }} />}
                          <div style={{ padding: '16px 20px', flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{art.category?.replace(/_/g,' ')}</div>
                            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1rem', color: '#111', marginBottom: 5 }}>{art.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>By Dr. {art.doctor?.username} · ❤️ {art.likesCount || 0} likes</div>
                          </div>
                        </div>
                      ))}
                    </div>
              }
            </div>
          )}

          {/* ─── Hospital Beds & Inpatient Management ─── */}
          {view === 'beds' && (
            <AdminHospitalBedsView setGlobalAlert={setAlert} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Hospital Beds & Inpatient Operations Component ── */
function AdminHospitalBedsView({ setGlobalAlert }) {
  const [bedsData, setBedsData] = useState(null)
  const [bedRequests, setBedRequests] = useState([])
  const [selectedWard, setSelectedWard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState('ALL') // 'ALL' | 'REQUESTS' | 'GRID'
  const [processingId, setProcessingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [beds, reqs] = await Promise.all([
        apiAdminGetHospitalBeds().catch(() => null),
        apiAdminGetBedRequests().catch(() => [])
      ])
      setBedsData(beds)
      setBedRequests(reqs || [])
      if (beds && beds.wards && beds.wards.length > 0) {
        setSelectedWard(curr => {
          if (curr) {
            const found = beds.wards.find(w => w.code === curr.code)
            return found || beds.wards[0]
          }
          return beds.wards[0]
        })
      }
    } catch (err) {
      setGlobalAlert({ type: 'error', msg: err.message || 'Failed to load bed operations data.' })
    } finally {
      setLoading(false)
    }
  }, [setGlobalAlert])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAcceptRequest(requestId) {
    setProcessingId(requestId)
    try {
      await apiAdminAcceptBedRequest(requestId, { adminNotes: 'Approved & assigned by Hospital Admin.' })
      setGlobalAlert({ type: 'success', msg: `✅ Bed Request #${requestId} accepted! Bed allocated successfully.` })
      await loadData()
    } catch (err) {
      setGlobalAlert({ type: 'error', msg: err.message || 'Failed to accept request.' })
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRejectRequest(requestId) {
    setProcessingId(requestId)
    try {
      await apiAdminRejectBedRequest(requestId, { adminNotes: 'Declined due to bed unavailability or triage priority.' })
      setGlobalAlert({ type: 'success', msg: `Request #${requestId} rejected.` })
      await loadData()
    } catch (err) {
      setGlobalAlert({ type: 'error', msg: err.message || 'Failed to reject request.' })
    } finally {
      setProcessingId(null)
    }
  }

  async function handleToggleBedStatus(wardCode, bedNo, newStatus) {
    try {
      await apiAdminUpdateBedStatus({
        wardCode,
        bedNo,
        status: newStatus,
        patientCode: newStatus === 'OCCUPIED' ? 'ADM-INPATIENT' : newStatus === 'MAINTENANCE' ? 'Sanitizing' : '—'
      })
      setGlobalAlert({ type: 'success', msg: `Bed ${bedNo} status updated to ${newStatus}.` })
      await loadData()
    } catch (err) {
      setGlobalAlert({ type: 'error', msg: err.message || 'Failed to update bed status.' })
    }
  }

  const pendingCount = (bedRequests || []).filter(r => r.status === 'PENDING').length

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">🛏️ Hospital Bed & Inpatient Management</h2>
          <p className="page-header-sub">Supervise specialized inpatient wards, accept patient bed booking requests, and maintain bed occupancy.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('ALL')}
          >
            All Operations
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'REQUESTS' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('REQUESTS')}
          >
            Pending Requests {pendingCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.72rem', marginLeft: 4 }}>{pendingCount}</span>}
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'GRID' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('GRID')}
          >
            Ward Bed Matrix
          </button>
          <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, borderRadius: 14, background: '#ffffff', border: '1.5px solid #bae6fd' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Total Capacity</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
            {bedsData?.totalBeds || 150} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Beds</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>Across 6 Inpatient Wards</div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 14, background: '#ffffff', border: '1.5px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Available Now</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
            {bedsData?.availableBeds || 0} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Free</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, marginTop: 2 }}>Ready for Admission</div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 14, background: '#ffffff', border: '1.5px solid #fecaca' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Currently Occupied</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626', marginTop: 4 }}>
            {bedsData?.occupiedBeds || 0} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Patients</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#991b1b', marginTop: 2 }}>Under Active Medical Care</div>
        </div>

        <div className="card" style={{
          padding: 18, borderRadius: 14, background: pendingCount > 0 ? '#fffbeb' : '#ffffff',
          border: `1.5px solid ${pendingCount > 0 ? '#fde68a' : '#e2e8f0'}`
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: pendingCount > 0 ? '#b45309' : '#475569', textTransform: 'uppercase' }}>
            Pending Bed Requests
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: pendingCount > 0 ? '#d97706' : '#0f172a', marginTop: 4 }}>
            {pendingCount} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Requests</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: pendingCount > 0 ? '#b45309' : '#64748b', fontWeight: 600, marginTop: 2 }}>
            {pendingCount > 0 ? 'Requires Admin Approval' : 'All Requests Handled'}
          </div>
        </div>
      </div>

      {/* Section 1: Patient Bed Booking Requests Queue */}
      {(activeSubTab === 'ALL' || activeSubTab === 'REQUESTS') && (
        <div className="card" style={{ marginBottom: 26, borderRadius: 16 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#0284c7" /> Patient Bed Booking Requests ({bedRequests.length})
            </div>
            {pendingCount > 0 && (
              <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem' }}>
                {pendingCount} Awaiting Your Review
              </span>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {bedRequests.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                No patient bed booking requests recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px' }}>Req ID</th>
                      <th style={{ padding: '12px 14px' }}>Patient Name</th>
                      <th style={{ padding: '12px 14px' }}>Contact Phone</th>
                      <th style={{ padding: '12px 14px' }}>Requested Ward & Bed</th>
                      <th style={{ padding: '12px 14px' }}>Urgency</th>
                      <th style={{ padding: '12px 14px' }}>Requested At</th>
                      <th style={{ padding: '12px 14px' }}>Notes / Symptoms</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bedRequests.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800 }}>#{r.id}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{r.patientName}</td>
                        <td style={{ padding: '12px 14px' }}>{r.contactPhone || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{r.wardName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#0284c7' }}>Bed: {r.bedNo || 'Any'}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 12,
                            background: r.urgency === 'CRITICAL' ? '#fee2e2' : r.urgency === 'HIGH' ? '#fef3c7' : '#e0f2fe',
                            color: r.urgency === 'CRITICAL' ? '#991b1b' : r.urgency === 'HIGH' ? '#92400e' : '#0369a1'
                          }}>
                            {r.urgency || 'HIGH'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : 'Recent'}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: 180, color: '#475569', fontSize: '0.8rem' }}>
                          {r.notes || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {r.status === 'PENDING' && (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem' }}>
                              Pending
                            </span>
                          )}
                          {r.status === 'ACCEPTED' && (
                            <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem' }}>
                              Allocated ({r.bedNo})
                            </span>
                          )}
                          {r.status === 'REJECTED' && (
                            <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800, padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem' }}>
                              Declined
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {r.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={processingId === r.id}
                                onClick={() => handleAcceptRequest(r.id)}
                                style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700 }}
                              >
                                {processingId === r.id ? '…' : '✓ Accept'}
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                disabled={processingId === r.id}
                                onClick={() => handleRejectRequest(r.id)}
                                style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#dc2626', borderColor: '#fca5a5' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Specialized Inpatient Units & Bed Maintenance Matrix (Image 4) */}
      {(activeSubTab === 'ALL' || activeSubTab === 'GRID') && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Left: Specialized Inpatient Units List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 2 }}>
                Specialized Inpatient Units
              </div>
              {(bedsData?.wards || []).map(w => {
                const isSelected = selectedWard?.code === w.code
                return (
                  <div
                    key={w.code}
                    onClick={() => setSelectedWard(w)}
                    style={{
                      padding: 14, borderRadius: 12, cursor: 'pointer',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      boxShadow: isSelected ? '0 4px 14px rgba(2,132,199,0.12)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.94rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                        {w.wardName}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12 }}>
                        {w.available} Free
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 4 }}>
                      📍 {w.floor}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569', marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                      <span>Total Beds: {w.totalBeds}</span>
                      <span>Occupied: {w.occupied}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: Selected Ward Bed Grid & Admin Operations */}
            {selectedWard && (
              <div className="card" style={{ padding: 22, borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 18 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      🏥 {selectedWard.wardName}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Floor: {selectedWard.floor} · Nurse-Patient Ratio: {selectedWard.nurseRatio}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Ventilators Available:</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>{selectedWard.ventilatorsAvailable} Units</div>
                  </div>
                </div>

                {/* Legend & Admin Instruction */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 18, fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontWeight: 700 }}>Available ({selectedWard.available})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ fontWeight: 700 }}>Occupied ({selectedWard.occupied})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ fontWeight: 700 }}>Sanitizing / Prep</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                    💡 Admin: Click buttons on any bed to switch status
                  </span>
                </div>

                {/* Bed Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                  {(selectedWard.beds || []).map(b => {
                    const isAvailable = b.status === 'AVAILABLE'
                    const isOccupied = b.status === 'OCCUPIED'
                    return (
                      <div
                        key={b.bedNo}
                        style={{
                          padding: 14, borderRadius: 12, textAlign: 'center',
                          border: `1.5px solid ${isAvailable ? '#86efac' : isOccupied ? '#fca5a5' : '#fde68a'}`,
                          background: isAvailable ? '#f0fdf4' : isOccupied ? '#fef2f2' : '#fffbeb',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '1.5rem' }}>🛏️</div>
                        <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a', marginTop: 4 }}>
                          {b.bedNo}
                        </div>
                        <div style={{
                          fontSize: '0.72rem', fontWeight: 800, marginTop: 4,
                          color: isAvailable ? '#166534' : isOccupied ? '#991b1b' : '#92400e'
                        }}>
                          {b.status}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2, height: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.patientCode}
                        </div>

                        {/* Admin Bed Maintenance Buttons */}
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                          {!isAvailable && (
                            <button
                              onClick={() => handleToggleBedStatus(selectedWard.code, b.bedNo, 'AVAILABLE')}
                              style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '3px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                              title="Set Available"
                            >
                              Free
                            </button>
                          )}
                          {!isOccupied && (
                            <button
                              onClick={() => handleToggleBedStatus(selectedWard.code, b.bedNo, 'OCCUPIED')}
                              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '3px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                              title="Set Occupied"
                            >
                              Occupy
                            </button>
                          )}
                          {b.status !== 'MAINTENANCE' && (
                            <button
                              onClick={() => handleToggleBedStatus(selectedWard.code, b.bedNo, 'MAINTENANCE')}
                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                              title="Set Sanitizing / Prep"
                            >
                              Prep
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
