import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, Plus, Trash2, AlertTriangle, TrendingUp,
  DollarSign, CheckCircle2, ShoppingBag, Minus, Building, Award,
  Phone, Mail, User, ShieldCheck, MapPin, Briefcase, GraduationCap,
  Sparkles, Layers, RefreshCw
} from 'lucide-react'
import DashLayout from '../components/DashLayout'
import {
  getUsername,
  apiGetPharmacyMedicines,
  apiAddPharmacyMedicine,
  apiAdjustPharmacyMedicine,
  apiDeletePharmacyMedicine,
  apiGetPharmacyAnalytics,
  apiGetAllPharmacyOrders,
  apiGetPharmacistProfile,
  apiSavePharmacistProfile,
  apiChangePassword,
  fmtDateTime
} from '../api'
import '../components/ui.css'
import '../components/dashboard.css'

/* ── Change Password Card ─────────────────────────── */
function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [alert, setAlert]                     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!currentPassword) {
      setAlert({ type: 'warning', msg: 'Please enter your current password.' }); return
    }
    if (newPassword.length < 6) {
      setAlert({ type: 'warning', msg: 'New password must be at least 6 characters.' }); return
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: 'warning', msg: 'New passwords do not match.' }); return
    }

    setLoading(true)
    try {
      await apiChangePassword(currentPassword, newPassword)
      setAlert({ type: 'success', msg: '✅ Password updated successfully! Use your new password for future logins.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to update password.' })
    } finally { setLoading(false) }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="card-header">
        <div className="card-title">
          <ShieldCheck size={18} style={{ color: 'var(--sky-600)' }} /> Security & Password Update
        </div>
      </div>
      <div className="card-body">
        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
            {alert.msg}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, maxWidth: 460 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Current / Temporary Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm New Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ width: 'fit-content', marginTop: 4 }}>
            {loading ? 'Updating Password…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Profile Section (Pharmacist Details & Offline Store) ───────────────── */
function ProfileSection() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    educationDetails: '',
    experienceYears: '',
    experienceSummary: '',
    offlineStoreName: '',
    licenseNumber: '',
    storeAddress: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [alert, setAlert]     = useState(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const data = await apiGetPharmacistProfile()
      if (data) {
        setProfile({
          fullName: data.fullName || getUsername() || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          educationDetails: data.educationDetails || '',
          experienceYears: data.experienceYears !== null && data.experienceYears !== undefined ? data.experienceYears : '',
          experienceSummary: data.experienceSummary || '',
          offlineStoreName: data.offlineStoreName || '',
          licenseNumber: data.licenseNumber || '',
          storeAddress: data.storeAddress || ''
        })
      }
    } catch (err) {
      console.warn('Could not fetch pharmacist profile from backend:', err)
      // Fallback from localStorage
      const cached = localStorage.getItem('pharmacy_profile_' + getUsername())
      if (cached) {
        try { setProfile(JSON.parse(cached)) } catch (_) {}
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      const payload = {
        ...profile,
        experienceYears: profile.experienceYears ? Number(profile.experienceYears) : 0
      }
      await apiSavePharmacistProfile(payload)
      localStorage.setItem('pharmacy_profile_' + getUsername(), JSON.stringify(payload))
      setAlert({ type: 'success', msg: '✅ Pharmacist profile and offline store details saved successfully!' })
    } catch (err) {
      // In case of network glitch, cache locally too
      localStorage.setItem('pharmacy_profile_' + getUsername(), JSON.stringify(profile))
      setAlert({ type: 'success', msg: '✅ Profile updated and stored locally.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Pharmacist Professional Profile</h2>
          <p className="page-header-sub">Manage your personal credentials, education, pharmacy experience, and offline dispensary details.</p>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
          {alert.msg}
        </div>
      )}

      {/* Account Snapshot */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">
            <User size={18} style={{ color: 'var(--sky-600)' }} /> System Credentials
          </div>
          <span className="badge badge-success">🟢 Active Pharmacy Staff</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-500)', fontWeight: 600, textTransform: 'uppercase' }}>Username</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-900)' }}>{getUsername()}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-500)', fontWeight: 600, textTransform: 'uppercase' }}>Designation Role</div>
              <div><span className="role-chip pharmacy">PHARMACIST</span></div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-500)', fontWeight: 600, textTransform: 'uppercase' }}>Dispensary Access</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-700)' }}>Full Medicine Inventory & Billing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pharmacist Personal & Store Details Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">
            <Briefcase size={18} style={{ color: 'var(--sky-600)' }} /> Pharmacist & Offline Store Information
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>Loading pharmacist profile…</div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name / Chemist Name *</label>
                <div className="input-wrap">
                  <span className="input-icon"><User size={16} /></span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Rajesh Sharma, Pharm.D"
                    value={profile.fullName}
                    onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Email *</label>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rajesh.pharmacy@medicare.in"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone / Mobile Number *</label>
                <div className="input-wrap">
                  <span className="input-icon"><Phone size={16} /></span>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 98765 43210"
                    value={profile.phoneNumber}
                    onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Offline Store Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Offline Store / Pharmacy Name *</label>
                <div className="input-wrap">
                  <span className="input-icon"><Building size={16} /></span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MediCare Apollo Central Pharmacy"
                    value={profile.offlineStoreName}
                    onChange={e => setProfile(p => ({ ...p, offlineStoreName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Pharmacy License Number */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Drug License / Registration Number</label>
                <div className="input-wrap">
                  <span className="input-icon"><Award size={16} /></span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. DL-2024-MH-49201"
                    value={profile.licenseNumber}
                    onChange={e => setProfile(p => ({ ...p, licenseNumber: e.target.value }))}
                  />
                </div>
              </div>

              {/* Years of Experience */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pharmacy Experience (Years)</label>
                <div className="input-wrap">
                  <span className="input-icon"><Briefcase size={16} /></span>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    className="form-input"
                    placeholder="e.g. 8"
                    value={profile.experienceYears}
                    onChange={e => setProfile(p => ({ ...p, experienceYears: e.target.value }))}
                  />
                </div>
              </div>

              {/* Education Background */}
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="form-label">Education & Qualifications</label>
                <div className="input-wrap">
                  <span className="input-icon" style={{ top: 22 }}><GraduationCap size={16} /></span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. B.Pharm, M.Pharm (Pharmacology) - JNTU College of Pharmaceutical Sciences"
                    value={profile.educationDetails}
                    onChange={e => setProfile(p => ({ ...p, educationDetails: e.target.value }))}
                  />
                </div>
              </div>

              {/* Experience Summary */}
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="form-label">Experience in Pharmacy & Clinical Dispensing</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Provide background on your hospital pharmacy experience, inventory protocols, patient drug counseling, and sterile formulation handling."
                  value={profile.experienceSummary}
                  onChange={e => setProfile(p => ({ ...p, experienceSummary: e.target.value }))}
                />
              </div>

              {/* Offline Store Address */}
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="form-label">Offline Store Address & Location</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="e.g. Ground Floor, Outpatient Wing A, MediCare Super Speciality Hospital, MG Road"
                  value={profile.storeAddress}
                  onChange={e => setProfile(p => ({ ...p, storeAddress: e.target.value }))}
                />
              </div>

              {/* Submit Button */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Profile…' : '💾 Save Profile Information'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ChangePasswordCard />
    </div>
  )
}

/* ── Proper Data Analytics Section (No Backend Connected Status) ────────── */
function OverviewSection() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const data = await apiGetPharmacyAnalytics()
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setLoading(false)
    }
  }

  // Pre-calculated metrics for analytics
  const medicines = analytics?.medicines || []
  const totalMeds = medicines.length
  const totalValuation = analytics?.totalInventoryValue || medicines.reduce((sum, m) => sum + (m.sheetsCount * m.pricePerSheet), 0)
  const totalSheets = analytics?.totalSheets || medicines.reduce((sum, m) => sum + m.sheetsCount, 0)
  const totalTablets = analytics?.totalTablets || medicines.reduce((sum, m) => sum + (m.sheetsCount * m.tabletsPerSheet), 0)
  const outOfStockMeds = medicines.filter(m => m.sheetsCount === 0)
  const lowStockMeds = medicines.filter(m => m.sheetsCount > 0 && m.sheetsCount <= 10)
  const healthyMeds = medicines.filter(m => m.sheetsCount > 10)

  const healthyPct = totalMeds > 0 ? Math.round((healthyMeds.length / totalMeds) * 100) : 0
  const lowPct = totalMeds > 0 ? Math.round((lowStockMeds.length / totalMeds) * 100) : 0
  const outPct = totalMeds > 0 ? Math.round((outOfStockMeds.length / totalMeds) * 100) : 0

  // Top 5 valued medicines in inventory
  const topValuedMeds = [...medicines]
    .sort((a, b) => (b.sheetsCount * b.pricePerSheet) - (a.sheetsCount * a.pricePerSheet))
    .slice(0, 5)

  return (
    <div className="view-section">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <div className="welcome-greeting">Pharmacy Management & Real-Time Analytics</div>
          <div className="welcome-name">Welcome, {getUsername()} 👋</div>
          <div className="welcome-desc">
            Monitor inventory valuation, stock health ratios, tablet replenishment alerts, and customer prescription fulfillment in real time.
          </div>
        </div>
        <div className="welcome-emoji">💊</div>
      </div>

      {/* Top Analytics KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 26 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Total Inventory Valuation</div>
            <div className="stat-value">₹{Number(totalValuation).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-500)', marginTop: 2 }}>{totalSheets} sheets across {totalMeds} medicines</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#CFFAFE', color: '#0891B2' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-label">Total Medicine Volume</div>
            <div className="stat-value">{Number(totalTablets).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-500)', marginTop: 2 }}>Individual tablet units ready to dispense</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">Stock Health Index</div>
            <div className="stat-value">{healthyPct}%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-500)', marginTop: 2 }}>{healthyMeds.length} of {totalMeds} medicines adequately stocked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="stat-label">Customer Orders Fulfilled</div>
            <div className="stat-value">₹{Number(analytics?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-500)', marginTop: 2 }}>{analytics?.totalOrders || 0} prescription receipts processed</div>
          </div>
        </div>
      </div>

      {/* Analytics Visual Breakdown */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Stock Health Segment Bar & Distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} style={{ color: 'var(--sky-600)' }} /> Stock Distribution & Inventory Health
            </div>
            <span className="badge badge-primary">Real-Time Data</span>
          </div>
          <div className="card-body">
            {/* Visual Health Proportion Meter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: 8 }}>
                <span>Inventory Health Proportions</span>
                <span>{healthyPct}% Healthy · {lowPct}% Low · {outPct}% Out</span>
              </div>
              <div style={{ height: 14, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden', display: 'flex', gap: 2 }}>
                <div style={{ width: `${healthyPct}%`, background: '#16A34A', borderRadius: '99px 0 0 99px' }} title={`Healthy: ${healthyPct}%`} />
                <div style={{ width: `${lowPct}%`, background: '#F59E0B' }} title={`Low Stock: ${lowPct}%`} />
                <div style={{ width: `${outPct}%`, background: '#DC2626', borderRadius: '0 99px 99px 0' }} title={`Out of Stock: ${outPct}%`} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '12px', color: 'var(--text-600)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A' }} /> Adequate (&gt;10 sheets): {healthyMeds.length}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} /> Low Stock (1–10): {lowStockMeds.length}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626' }} /> Depleted (0): {outOfStockMeds.length}
                </span>
              </div>
            </div>

            {/* Medicine Distribution List with Visual Meters */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>Loading analytics…</div>
            ) : !medicines.length ? (
              <div style={{ textAlign: 'center', color: 'var(--text-500)', padding: 20 }}>No medicine data in inventory.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {medicines.slice(0, 6).map(m => {
                  const maxSheets = 60
                  const pct = Math.min(100, Math.round((m.sheetsCount / maxSheets) * 100))
                  const barColor = m.sheetsCount === 0 ? '#DC2626' : m.sheetsCount <= 10 ? '#F59E0B' : '#16A34A'

                  return (
                    <div key={m.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-900)' }}>{m.medicineName}</span>
                        <span style={{ color: 'var(--text-600)' }}>
                          <strong>{m.sheetsCount} sheets</strong> ({m.sheetsCount * m.tabletsPerSheet} tablets) · ₹{m.pricePerSheet?.toFixed(2)}/sheet
                        </span>
                      </div>
                      <div style={{ background: 'var(--sky-100)', borderRadius: 8, height: 9, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${pct}%`, background: barColor, borderRadius: 8, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Highest Valued Medicines in Stock */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <DollarSign size={18} style={{ color: 'var(--sky-600)' }} /> Top Inventory Assets by Valuation
            </div>
            <span className="badge badge-primary">Capital Distribution</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="tbl-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Stock Units</th>
                    <th>Price / Sheet</th>
                    <th>Asset Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topValuedMeds.map(m => {
                    const itemValuation = m.sheetsCount * m.pricePerSheet
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-900)' }}>{m.medicineName}</td>
                        <td>{m.sheetsCount} sheets <span style={{ color: 'var(--text-500)', fontSize: '12px' }}>({m.sheetsCount * m.tabletsPerSheet} tabs)</span></td>
                        <td>₹{m.pricePerSheet?.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--sky-700)' }}>₹{itemValuation.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                  {!topValuedMeds.length && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--text-500)' }}>
                        No inventory data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Warnings Table */}
      {(lowStockMeds.length > 0 || outOfStockMeds.length > 0) && (
        <div className="card" style={{ marginBottom: 24, border: '1.5px solid #FCD34D' }}>
          <div className="card-header" style={{ background: '#FFFBEB' }}>
            <div className="card-title" style={{ color: '#92400E' }}>
              <AlertTriangle size={18} /> Priority Re-stock Alerts ({lowStockMeds.length + outOfStockMeds.length} Medicines)
            </div>
            <span className="badge badge-warning">Action Required</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="tbl-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Current Sheets</th>
                    <th>Tablets Remaining</th>
                    <th>Stock Level</th>
                    <th>Suggested Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...outOfStockMeds, ...lowStockMeds].map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700 }}>{m.medicineName}</td>
                      <td style={{ fontWeight: 700, color: m.sheetsCount === 0 ? 'var(--danger)' : '#B45309' }}>
                        {m.sheetsCount} sheets
                      </td>
                      <td>{m.sheetsCount * m.tabletsPerSheet} tablets</td>
                      <td>
                        {m.sheetsCount === 0 ? (
                          <span className="badge badge-error">🚨 Out of Stock (0)</span>
                        ) : (
                          <span className="badge badge-warning">⚠️ Low Stock ({m.sheetsCount})</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-600)' }}>
                          Recommend adding +{m.sheetsCount === 0 ? 25 : 15} sheets to inventory
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Inventory Section (Add/Update with Cumulative Stock + +/- Stepper Counters) ── */
function InventorySection() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading]     = useState(true)

  // Add Medicine Form state
  const [medicineName, setMedicineName]       = useState('')
  const [sheetsCount, setSheetsCount]         = useState('')
  const [tabletsPerSheet, setTabletsPerSheet] = useState('')
  const [pricePerSheet, setPricePerSheet]     = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [adjustingId, setAdjustingId]         = useState(null)
  const [alert, setAlert]                     = useState(null)

  useEffect(() => {
    loadInventory()
  }, [])

  async function loadInventory() {
    setLoading(true)
    try {
      const list = await apiGetPharmacyMedicines()
      setMedicines(list || [])
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to load inventory.' })
    } finally {
      setLoading(false)
    }
  }

  // Check if medicine already exists to inform the user that stock will be added up
  const matchedExisting = medicineName.trim()
    ? medicines.find(m => m.medicineName.toLowerCase() === medicineName.trim().toLowerCase())
    : null

  async function handleAddMedicine(e) {
    e.preventDefault()
    setAlert(null)

    if (!medicineName.trim()) {
      setAlert({ type: 'warning', msg: 'Please enter medicine name.' }); return
    }
    if (!sheetsCount || Number(sheetsCount) < 0) {
      setAlert({ type: 'warning', msg: 'Number of sheets must be 0 or greater.' }); return
    }
    if (!tabletsPerSheet || Number(tabletsPerSheet) <= 0) {
      setAlert({ type: 'warning', msg: 'Tablets per sheet must be greater than 0.' }); return
    }
    if (!pricePerSheet || Number(pricePerSheet) < 0) {
      setAlert({ type: 'warning', msg: 'Price per sheet must be 0 or greater.' }); return
    }

    setSubmitting(true)
    try {
      const newSheets = Number(sheetsCount)
      const res = await apiAddPharmacyMedicine({
        medicineName: medicineName.trim(),
        sheetsCount: newSheets,
        tabletsPerSheet: Number(tabletsPerSheet),
        pricePerSheet: Number(pricePerSheet)
      })

      if (matchedExisting) {
        setAlert({
          type: 'success',
          msg: `✅ Added ${newSheets} sheets to existing stock of ${matchedExisting.sheetsCount} sheets for "${matchedExisting.medicineName}". New total stock: ${res.sheetsCount || (matchedExisting.sheetsCount + newSheets)} sheets!`
        })
      } else {
        setAlert({ type: 'success', msg: `✅ Medicine "${medicineName.trim()}" added to inventory with ${newSheets} sheets!` })
      }

      setMedicineName('')
      setSheetsCount('')
      setTabletsPerSheet('')
      setPricePerSheet('')
      loadInventory()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to save medicine.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Quick increment/decrement counter for sheets or loose tablets
  async function handleAdjust(id, sheetDelta, tabletsDelta) {
    setAdjustingId(id)
    try {
      // Optimistic update
      setMedicines(prev => prev.map(m => {
        if (m.id !== id) return m
        let sheets = m.sheetsCount !== undefined ? m.sheetsCount : 0
        let loose = m.looseTablets !== undefined ? m.looseTablets : 0
        const perSheet = (m.tabletsPerSheet && m.tabletsPerSheet > 0) ? m.tabletsPerSheet : 10

        if (sheetDelta) {
          sheets = Math.max(0, sheets + sheetDelta)
        }

        if (tabletsDelta) {
          if (tabletsDelta < 0) {
            if (loose > 0) {
              loose = Math.max(0, loose + tabletsDelta)
            } else if (sheets > 0) {
              sheets = sheets - 1
              loose = perSheet - 1
            }
          } else {
            loose = loose + tabletsDelta
            if (loose >= perSheet) {
              sheets += Math.floor(loose / perSheet)
              loose = loose % perSheet
            }
          }
        }

        return { ...m, sheetsCount: sheets, looseTablets: loose }
      }))

      const res = await apiAdjustPharmacyMedicine(id, {
        sheetDelta: sheetDelta || 0,
        tabletsDelta: tabletsDelta || 0
      })
      if (res) {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...res } : m))
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err)
      loadInventory()
      setAlert({ type: 'error', msg: 'Failed to update stock counter: ' + err.message })
    } finally {
      setAdjustingId(null)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return
    try {
      await apiDeletePharmacyMedicine(id)
      setAlert({ type: 'success', msg: `✅ Deleted "${name}" from inventory.` })
      loadInventory()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to delete medicine.' })
    }
  }

  const calcTotalTablets = sheetsCount && tabletsPerSheet ? Number(sheetsCount) * Number(tabletsPerSheet) : 0
  const calcPricePerTablet = sheetsCount && tabletsPerSheet && pricePerSheet && Number(tabletsPerSheet) > 0
    ? (Number(pricePerSheet) / Number(tabletsPerSheet)).toFixed(2)
    : 0

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Medicine & Tablet Inventory</h2>
          <p className="page-header-sub">
            Add new medicines or add stock to existing medicines. Use live increment/decrement counters in the table.
          </p>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 18 }}>
          {alert.msg}
        </div>
      )}

      {/* Add / Update Medicine Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">
            <Plus size={18} style={{ color: 'var(--sky-600)' }} /> Add Stock / New Medicine
          </div>
          {matchedExisting && (
            <span className="badge badge-warning">
              ⚡ Existing Medicine: New sheets will add up to current {matchedExisting.sheetsCount} sheets
            </span>
          )}
        </div>
        <div className="card-body">
          <form onSubmit={handleAddMedicine} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Medicine Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Paracetamol 650mg"
                value={medicineName}
                onChange={e => {
                  const val = e.target.value
                  setMedicineName(val)
                  // If matching existing, pre-populate default packaging & price
                  const found = medicines.find(m => m.medicineName.toLowerCase() === val.trim().toLowerCase())
                  if (found) {
                    if (!tabletsPerSheet) setTabletsPerSheet(found.tabletsPerSheet)
                    if (!pricePerSheet) setPricePerSheet(found.pricePerSheet)
                  }
                }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                No. of Sheets to Add * {matchedExisting && <span style={{ color: 'var(--sky-600)', fontSize: '12px' }}>(Current: {matchedExisting.sheetsCount})</span>}
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 50"
                min="0"
                value={sheetsCount}
                onChange={e => setSheetsCount(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tablets per Sheet *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 10"
                min="1"
                value={tabletsPerSheet}
                onChange={e => setTabletsPerSheet(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Price of One Sheet (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 45.00"
                min="0"
                value={pricePerSheet}
                onChange={e => setPricePerSheet(e.target.value)}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              <div style={{ fontSize: '13.5px', color: 'var(--text-600)' }}>
                {calcTotalTablets > 0 && (
                  <span>
                    💡 Batch Total: <strong>{calcTotalTablets} tablets</strong> · Approx. <strong>₹{calcPricePerTablet}/tablet</strong>
                    {matchedExisting && (
                      <span style={{ color: 'var(--sky-700)', fontWeight: 600, marginLeft: 8 }}>
                        (Will result in {matchedExisting.sheetsCount + Number(sheetsCount)} sheets total)
                      </span>
                    )}
                  </span>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Updating Stock…' : matchedExisting ? '➕ Add to Existing Stock' : '➕ Add New Medicine'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inventory Stock Catalogue Table with Live Counters */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Package size={18} style={{ color: 'var(--sky-600)' }} /> Inventory Stock Catalogue & Counter Steppers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-primary">{medicines.length} Medicines</span>
            <button className="btn btn-ghost btn-sm" onClick={loadInventory} disabled={loading} title="Refresh Catalogue">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading inventory medicines…</div>
          ) : medicines.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-500)' }}>
              No medicines found in inventory. Fill out the form above to add your first medicine.
            </div>
          ) : (
            <div className="tbl-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Medicine Name</th>
                    <th>Sheets Count</th>
                    <th>No of Tablets per Sheet</th>
                    <th>Tablets</th>
                    <th>Price / Sheet</th>
                    <th>Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(m => {
                    const isOutOfStock = m.sheetsCount === 0 && (!m.looseTablets || m.looseTablets === 0)
                    const isLowStock   = m.sheetsCount > 0 && m.sheetsCount <= 10
                    const isAdjusting  = adjustingId === m.id

                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-400)' }}>#{m.id}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-900)' }}>{m.medicineName}</td>

                        {/* Sheets Stepper Counter */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', padding: '4px 8px', borderRadius: 10, border: '1.5px solid var(--sky-200)' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: 28, height: 28, padding: 0, minHeight: 28, borderRadius: 6 }}
                              onClick={() => handleAdjust(m.id, -1, 0)}
                              disabled={m.sheetsCount <= 0 || isAdjusting}
                              title="Decrease 1 Sheet"
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: 64, textAlign: 'center', color: 'var(--text-900)' }}>
                              {m.sheetsCount} sheets
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: 28, height: 28, padding: 0, minHeight: 28, borderRadius: 6 }}
                              onClick={() => handleAdjust(m.id, 1, 0)}
                              disabled={isAdjusting}
                              title="Increase 1 Sheet"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>

                        {/* No of Tablets per Sheet (Text display without increment/decrement buttons) */}
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-800)' }}>
                            {m.tabletsPerSheet} tabs
                          </span>
                        </td>

                        {/* Separate Tablets Column (Initially 0, with increment & decrement) */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', padding: '4px 8px', borderRadius: 10, border: '1.5px solid var(--sky-200)' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: 28, height: 28, padding: 0, minHeight: 28, borderRadius: 6 }}
                              onClick={() => handleAdjust(m.id, 0, -1)}
                              disabled={(m.sheetsCount <= 0 && (!m.looseTablets || m.looseTablets <= 0)) || isAdjusting}
                              title="Decrease 1 Tablet (reduces 1 sheet if at 0)"
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: 54, textAlign: 'center', color: 'var(--text-900)' }}>
                              {m.looseTablets !== undefined && m.looseTablets !== null ? m.looseTablets : 0} tabs
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: 28, height: 28, padding: 0, minHeight: 28, borderRadius: 6 }}
                              onClick={() => handleAdjust(m.id, 0, 1)}
                              disabled={isAdjusting}
                              title="Increase 1 Tablet"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>

                        {/* Price */}
                        <td style={{ fontWeight: 700, color: 'var(--sky-700)' }}>
                          ₹{m.pricePerSheet?.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td>
                          {isOutOfStock && <span className="badge badge-error">🚨 Out of Stock (0)</span>}
                          {isLowStock   && <span className="badge badge-warning">⚠️ Low Stock ({m.sheetsCount})</span>}
                          {!isOutOfStock && !isLowStock && <span className="badge badge-success">🟢 In Stock</span>}
                        </td>

                        {/* Action: Delete only (+10 Sheets removed) */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0 10px', height: 28, fontSize: '12px' }}
                              onClick={() => handleDelete(m.id, m.medicineName)}
                              title="Delete Medicine"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Customer Orders & Billing Section ──────────────────── */
function OrdersSection() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    const interval = setInterval(() => {
      loadOrders()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadOrders() {
    try {
      const data = await apiGetAllPharmacyOrders()
      setOrders(data || [])
    } catch (err) {
      console.error('Failed to load pharmacy orders', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Customer Prescription Orders & Billing</h2>
          <p className="page-header-sub">View customer orders placed for doctor prescriptions and fulfilled itemized receipts.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadOrders} disabled={loading}>
          🔄 Refresh Receipts
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShoppingBag size={18} style={{ color: 'var(--sky-600)' }} /> Orders & Billing Receipts
          </div>
          <span className="badge badge-primary">{orders.length} Orders</span>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 28 }}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-500)' }}>
              No prescription orders placed yet by customers.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {orders.map(o => (
                <div key={o.id} style={{
                  border: '1.5px solid var(--sky-200)',
                  borderRadius: 14,
                  padding: 20,
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--sky-100)' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-900)' }}>Order #{o.id}</span>
                      <span className="badge badge-success" style={{ marginLeft: 10 }}>{o.status}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-500)' }}>
                      🕒 {fmtDateTime(o.orderedAt)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14, fontSize: '13.5px' }}>
                    <div>👤 <strong>Patient:</strong> {o.patient?.username}</div>
                    <div>🩺 <strong>Prescription ID:</strong> #{o.prescription?.id}</div>
                    <div>👨‍⚕️ <strong>Doctor:</strong> Dr. {o.prescription?.doctor?.username}</div>
                  </div>

                  {/* Itemized Medicine Billing */}
                  <div style={{ background: 'var(--sky-50)', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid var(--sky-100)' }}>
                    <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--sky-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      ORDERED MEDICINES & DISPENSED SHEETS
                    </div>
                    <table className="tbl" style={{ fontSize: '13.5px' }}>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Sheets Ordered</th>
                          <th>Price / Sheet</th>
                          <th>Item Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{item.medicineName}</td>
                            <td>{item.sheetsOrdered} sheets</td>
                            <td>₹{item.pricePerSheet?.toFixed(2)}</td>
                            <td style={{ fontWeight: 700, color: 'var(--sky-700)' }}>₹{item.itemTotal?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-600)' }}>Grand Total (Inclusive of GST):</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sky-700)' }}>
                      ₹{o.totalPrice?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── PharmacyDash (main export) ──────────── */
export default function PharmacyDash() {
  const [view, setView] = useState('overview')

  const navItems = [
    { id: 'overview',  label: 'Overview & Analytics', icon: <LayoutDashboard size={16} /> },
    { id: 'inventory', label: 'Medicine Inventory',   icon: <Package size={16} /> },
    { id: 'orders',    label: 'Customer Orders',       icon: <ShoppingBag size={16} /> },
  ]

  const titles = {
    overview:  'Pharmacy Overview & Analytics',
    inventory: 'Medicine Inventory & Tablet Counter',
    orders:    'Prescription Orders & Billing',
    profile:   'Pharmacist Professional Profile'
  }

  return (
    <DashLayout role="PHARMACY" activeView={view} setActiveView={setView} navItems={navItems} topbarTitle={titles[view]}>
      {view === 'overview'  && <OverviewSection />}
      {view === 'inventory' && <InventorySection />}
      {view === 'orders'    && <OrdersSection />}
      {view === 'profile'   && <ProfileSection />}
    </DashLayout>
  )
}
