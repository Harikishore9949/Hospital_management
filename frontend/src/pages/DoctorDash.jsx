import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
  Calendar, ClipboardList, Plus, RefreshCw, CheckCircle,
  XCircle, Video, User, Edit3, Save, X, Award, Briefcase,
  BookOpen, Stethoscope, Star, AlertCircle, Camera, ClipboardPlus, Trash2,
  Siren, FileEdit, Heart, Send, ChevronDown, ChevronUp, Newspaper, Mic, MicOff,
  RotateCcw, DollarSign,
} from 'lucide-react'
import DashLayout from '../components/DashLayout'
import {
  getUsername,
  apiCreateSlot, apiDeleteSlot, apiGetMySlots, apiGetAllAppointments,
  apiAcceptAppointment, apiRejectAppointment, apiDoctorCancelAppointment,
  apiStartSession,
  apiGetMyDoctorProfile, apiSaveDoctorProfile,
  apiIssuePrescription, apiGetPrescriptionByAppt,
  apiAcceptEmergency, apiResolveEmergency, apiGetActiveEmergencies, apiGetAcceptedByMe,
  apiCreateArticle, apiUpdateArticle, apiDeleteArticle, apiGetMyArticles,
  apiGetDoctorAdherenceAlerts, apiChangePassword,
  fmtDate, fmtTime, todayISO, getWsUrl,
} from '../api'
import '../components/ui.css'
import '../components/dashboard.css'

/* ── Alert ─────────────────────────────── */
function Alert({ type, msg, onClose }) {
  if (!msg) return null
  const icon = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type]
  return (
    <div className={`alert alert-${type}`} style={{ marginBottom: 18, cursor: 'pointer' }} onClick={onClose}>
      <span>{icon}</span><span>{msg}</span>
    </div>
  )
}

/* ── Schedule section ──────────────────── */
function ScheduleSection({ profileComplete, onGoToProfile }) {
  const [form, setForm]     = useState({ date: '', startTime: '', endTime: '' })
  const [slots, setSlots]   = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [alert, setAlert]   = useState(null)

  const loadSlots = useCallback(async () => {
    setFetching(true)
    try {
      const data = await apiGetMySlots()
      setSlots(data || [])
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to load slots: ' + (err.message || '') })
    } finally { setFetching(false) }
  }, [])

  useEffect(() => { loadSlots() }, [loadSlots])

  async function handleAdd(e) {
    e.preventDefault()
    setAlert(null)
    if (!form.date || !form.startTime || !form.endTime) {
      setAlert({ type: 'warning', msg: 'Please fill in all slot fields.' }); return
    }
    if (form.date < todayISO()) {
      setAlert({ type: 'warning', msg: 'Cannot add slot for a past date.' }); return
    }
    if (form.startTime >= form.endTime) {
      setAlert({ type: 'warning', msg: 'Start time must be strictly before end time.' }); return
    }
    setLoading(true)
    try {
      await apiCreateSlot(form)
      setForm({ date: '', startTime: '', endTime: '' })
      setAlert({ type: 'success', msg: 'Slot added successfully!' })
      await loadSlots()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to add slot.' })
    } finally { setLoading(false) }
  }

  async function handleDelete(slotId) {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return
    setAlert(null)
    setDeletingId(slotId)
    try {
      await apiDeleteSlot(slotId)
      setAlert({ type: 'success', msg: 'Slot deleted successfully.' })
      await loadSlots()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to delete slot.' })
    } finally { setDeletingId(null) }
  }

  const available = slots.filter(s => s.available)
  const booked    = slots.filter(s => !s.available)

  return (
    <div className="view-section">
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg,#1e2235 0%,#2563eb 60%,#1d4ed8 100%)' }}>
        <div className="welcome-text">
          <div className="welcome-greeting">Good day, Doctor 👋</div>
          <div className="welcome-name">{getUsername()}</div>
          <div className="welcome-desc">Create availability slots so patients can book appointments with you.</div>
        </div>
        <div className="welcome-emoji">👨‍⚕️</div>
      </div>

      {/* Profile incomplete — block slot creation */}
      {!profileComplete && (
        <div style={{
          background: 'linear-gradient(90deg,rgba(239,68,68,0.08),rgba(245,158,11,0.07))',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 3, fontSize: '0.95rem' }}>Profile incomplete — slots are disabled</div>
            <div style={{ fontSize: '0.83rem', color: 'var(--clr-neutral-600)' }}>You must complete your professional profile before adding availability slots. Patients need your details to trust and book you.</div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: 'auto', background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 3px 10px rgba(239,68,68,0.35)', flexShrink: 0 }}
            onClick={onGoToProfile}
          >
            Complete Profile
          </button>
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card-gradient sgc-blue">
          <span className="sgc-label">Total Slots</span>
          <div className="sgc-value">{slots.length}</div>
          <div className="sgc-sub">All availability slots</div>
        </div>
        <div className="stat-card-gradient sgc-teal">
          <span className="sgc-label">Available</span>
          <div className="sgc-value">{available.length}</div>
          <div className="sgc-sub">Open for booking</div>
        </div>
        <div className="stat-card-gradient sgc-orange">
          <span className="sgc-label">Booked</span>
          <div className="sgc-value">{booked.length}</div>
          <div className="sgc-sub">Confirmed appointments</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22, opacity: profileComplete ? 1 : 0.45, pointerEvents: profileComplete ? 'auto' : 'none' }}>
        <div className="card-header">
          <div className="card-title"><Plus size={16} /> Add Availability Slot</div>
        </div>
        <div className="card-body">
          <Alert {...(alert || {})} msg={alert?.msg} onClose={() => setAlert(null)} />
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input id="slot-date" className="form-input" type="date" min={todayISO()}
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Time</label>
                <input id="slot-start" className="form-input" type="time"
                  value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Time</label>
                <input id="slot-end" className="form-input" type="time" min={form.startTime || undefined}
                  value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button id="add-slot-btn" type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
                {loading ? <><span className="btn-spinner" /> Adding…</> : <><Calendar size={14} /> Add Slot</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><Calendar size={16} /> My Availability Slots</div>
          <button className="btn btn-outline btn-sm" onClick={loadSlots} disabled={fetching}>
            <RefreshCw size={13} /> {fetching ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>ID</th><th>Date</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {fetching
                ? <tr><td colSpan={6}><div className="page-spinner"><span className="spinner" /> Loading…</div></td></tr>
                : slots.length === 0
                  ? <tr><td colSpan={6}><div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <div className="empty-title">No slots yet</div>
                      <div className="empty-text">Use the form above to add your first slot.</div>
                    </div></td></tr>
                  : slots.map((s, i) => (
                    <tr key={s.id ?? i}>
                      <td><strong>{s.id ?? i + 1}</strong></td>
                      <td>{fmtDate(s.date)}</td>
                      <td>{fmtTime(s.startTime)}</td>
                      <td>{fmtTime(s.endTime)}</td>
                      <td>
                        {s.available
                          ? <span className="badge badge-success">🟢 Available</span>
                          : <span className="badge badge-error">🔴 Booked</span>}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', gap: 5, padding: '4px 10px' }}
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                        >
                          <Trash2 size={13} /> {deletingId === s.id ? 'Deleting…' : 'Delete Slot'}
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Microphone Speech Dictation Helper ───── */
function SpeechDictationButton({ onTranscript, style }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.')
      return
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => setListening(true)
      rec.onresult = (event) => {
        const transcript = event.results[0][0]?.transcript
        if (transcript) onTranscript(transcript)
      }
      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error)
        setListening(false)
      }
      rec.onend = () => setListening(false)

      recognitionRef.current = rec
      rec.start()
    } catch (err) {
      console.warn('Speech start error:', err)
      setListening(false)
    }
  }

  return (
    <button
      type="button"
      onClick={startListening}
      title={listening ? 'Listening... click to stop' : 'Click to dictate using microphone'}
      style={{
        background: listening ? '#ef4444' : 'rgba(37,99,235,0.08)',
        color: listening ? '#fff' : '#2563eb',
        border: listening ? '1px solid #dc2626' : '1px solid #bfdbfe',
        borderRadius: 6,
        padding: '3px 8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '0.72rem',
        fontWeight: 600,
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {listening ? <MicOff size={12} /> : <Mic size={12} />}
      <span>{listening ? 'Listening…' : '🎙️ Mic'}</span>
    </button>
  )
}

/* ── Default scheduled times helper ─────── */
const DEFAULT_TIMES = {
  1: '08:00 AM',
  2: '08:00 AM, 08:00 PM',
  3: '08:00 AM, 02:00 PM, 08:00 PM',
  4: '07:00 AM, 12:00 PM, 05:00 PM, 09:00 PM',
}

const EMPTY_MED = { medicineName: '', dosage: '', timesPerDay: '1', scheduledTimes: '08:00 AM', instructions: '', durationDays: 5 }

function formatTimeTokenAmPm(token) {
  if (!token) return ''
  const t = token.trim()
  if (!t) return ''
  if (/[ap]m/i.test(t)) return t
  const match = t.match(/^(\d{1,2}):(\d{2})$/)
  if (match) {
    let h = parseInt(match[1], 10)
    const m = parseInt(match[2], 10)
    if (h >= 1 && h <= 6) h += 12
    const ampm = h >= 12 ? 'PM' : 'AM'
    let h12 = h % 12
    if (h12 === 0) h12 = 12
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return t
}

function normalizeTimesWithAmPm(str) {
  if (!str) return ''
  return str.split(',').map(formatTimeTokenAmPm).join(', ')
}

/* ── Prescription Modal ─────────────────── */
function PrescriptionModal({ appointment, onClose }) {
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }])
  const [saving, setSaving]       = useState(false)
  const [alert, setAlert]         = useState(null)
  const [existing, setExisting]   = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  // Load existing prescription if any
  useEffect(() => {
    apiGetPrescriptionByAppt(appointment.id)
      .then(data => { setExisting(data); populateFromExisting(data) })
      .catch(() => setExisting(null))
      .finally(() => setLoadingExisting(false))
  }, [appointment.id])

  function populateFromExisting(data) {
    if (!data?.medicines?.length) return
    setMedicines(data.medicines.map(m => ({
      medicineName: m.medicineName || '',
      dosage: m.dosage || '',
      timesPerDay: String(m.timesPerDay || 1),
      scheduledTimes: normalizeTimesWithAmPm(m.scheduledTimes || '08:00 AM'),
      instructions: m.instructions || '',
      durationDays: m.durationDays || 5,
    })))
  }

  function addMed() { setMedicines(prev => [...prev, { ...EMPTY_MED }]) }
  function removeMed(i) { setMedicines(prev => prev.filter((_, idx) => idx !== i)) }
  function updateMed(i, field, value) {
    setMedicines(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      // Auto-fill scheduled times when timesPerDay changes
      if (field === 'timesPerDay') {
        next[i].scheduledTimes = DEFAULT_TIMES[parseInt(value)] || '08:00 AM'
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    const valid = medicines.filter(m => m.medicineName.trim())
    if (!valid.length) { setAlert({ type: 'warning', msg: 'Add at least one medicine.' }); return }
    setSaving(true)
    try {
      await apiIssuePrescription(appointment.id, {
        medicines: valid.map(m => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          timesPerDay: parseInt(m.timesPerDay) || 1,
          scheduledTimes: m.scheduledTimes.trim(),
          instructions: m.instructions.trim(),
          durationDays: parseInt(m.durationDays) || 5,
        }))
      })
      setAlert({ type: 'success', msg: '✅ Prescription issued successfully!' })
      setTimeout(onClose, 1400)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to issue prescription.' })
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 720,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        animation: 'fadeInUp 0.25s ease',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1.5px solid #e5e7eb',
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
          borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              💊 Issue Prescription
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Patient: <strong style={{ color: '#fff' }}>{appointment.patientFullName || appointment.patient?.username}</strong>
              {' · '}Appt ID: {appointment.id}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px' }}>
          {loadingExisting
            ? <div style={{ textAlign: 'center', padding: 20 }}>⏳ Loading…</div>
            : (
              <>
                {existing && (
                  <div style={{ background: 'linear-gradient(90deg,rgba(59,130,246,0.08),rgba(20,184,166,0.06))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: '0.82rem', color: '#1e40af' }}>
                    ℹ️ A prescription already exists for this appointment — submitting will <strong>replace</strong> it.
                  </div>
                )}

                {alert && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem',
                    background: alert.type === 'success' ? '#f0fdf4' : alert.type === 'warning' ? '#fefce8' : '#fef2f2',
                    color: alert.type === 'success' ? '#166534' : alert.type === 'warning' ? '#854d0e' : '#991b1b',
                    border: `1px solid ${alert.type === 'success' ? '#bbf7d0' : alert.type === 'warning' ? '#fde047' : '#fecaca'}`,
                  }}>{alert.msg}</div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Medicine rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {medicines.map((med, i) => (
                      <div key={i} style={{
                        border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px',
                        background: '#fafafa', position: 'relative',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Medicine {i + 1}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Medicine Name *</label>
                              <SpeechDictationButton onTranscript={text => updateMed(i, 'medicineName', (med.medicineName ? med.medicineName + ' ' : '') + text)} />
                            </div>
                            <input
                              className="form-input"
                              style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem' }}
                              placeholder="e.g. Paracetamol"
                              value={med.medicineName}
                              onChange={e => updateMed(i, 'medicineName', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Dosage *</label>
                            <input
                              className="form-input"
                              style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem' }}
                              placeholder="e.g. 500mg"
                              value={med.dosage}
                              onChange={e => updateMed(i, 'dosage', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Times per Day *</label>
                            <select
                              className="form-input"
                              style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem' }}
                              value={med.timesPerDay}
                              onChange={e => updateMed(i, 'timesPerDay', e.target.value)}
                            >
                              <option value="1">1 × daily</option>
                              <option value="2">2 × daily</option>
                              <option value="3">3 × daily</option>
                              <option value="4">4 × daily</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Duration (Days) *</label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              className="form-input"
                              style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem' }}
                              placeholder="e.g. 5"
                              value={med.durationDays || ''}
                              onChange={e => updateMed(i, 'durationDays', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                              Scheduled Times <span style={{ fontWeight: 400, color: '#2563eb' }}>(e.g. 08:00 AM, 08:00 PM)</span>
                            </label>
                            <input
                              className="form-input"
                              style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem' }}
                              placeholder="08:00 AM, 08:00 PM"
                              value={med.scheduledTimes}
                              onChange={e => updateMed(i, 'scheduledTimes', e.target.value)}
                              onBlur={e => updateMed(i, 'scheduledTimes', normalizeTimesWithAmPm(e.target.value))}
                              required
                            />
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 3 }}>Includes AM/PM timing. Auto-filled based on doses/day.</div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Instructions</label>
                              <SpeechDictationButton onTranscript={text => updateMed(i, 'instructions', (med.instructions ? med.instructions + ' ' : '') + text)} />
                            </div>
                            <input
                              className="form-input"
                              style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem' }}
                              placeholder="e.g. After meals, With water"
                              value={med.instructions}
                              onChange={e => updateMed(i, 'instructions', e.target.value)}
                            />
                          </div>
                        </div>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMed(i)}
                            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add medicine + Submit */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={addMed}
                      style={{ background: 'rgba(37,99,235,0.08)', border: '1.5px dashed #93c5fd', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Add Another Medicine
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ width: 'auto', marginLeft: 'auto', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
                    >
                      {saving ? <><span className="btn-spinner" /> Issuing…</> : <><ClipboardPlus size={14} /> Issue Prescription</>}
                    </button>
                  </div>
                </form>
              </>
            )}
        </div>
      </div>
    </div>
  )
}

/* ── Helper: Payment Deadline Remaining Time ──────────────────────── */
function getPaymentDeadlineInfo(deadline) {
  if (!deadline) return null
  const d = Array.isArray(deadline)
    ? new Date(deadline[0], deadline[1] - 1, deadline[2], deadline[3] || 0, deadline[4] || 0)
    : new Date(deadline)
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return { expired: true, text: '6-Hour Window Expired' }
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { expired: false, text: `${hrs}h ${mins}m left to pay`, hrs, mins }
}

/* ── Doctor Cancel with Refund Modal ───────────────────────────────── */
function DoctorCancelRefundModal({ appointment, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isPaid = appointment?.paymentStatus === 'PAID'
  const fee = appointment?.consultationFee || 500

  async function handleConfirm(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiDoctorCancelAppointment(appointment.id, reason)
      onSuccess?.(res)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeInUp 0.2s ease-out'
      }}>
        <div style={{
          padding: '18px 22px',
          background: isPaid ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPaid ? <><RotateCcw size={18} color="#fca5a5" /> Cancel Appointment & Issue Full Refund</> : <><XCircle size={18} color="#94a3b8" /> Cancel Appointment</>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleConfirm} style={{ padding: 22 }}>
          {isPaid ? (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '14px 16px',
              marginBottom: 16, fontSize: '0.86rem', color: '#991b1b'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 4 }}>
                ⚠️ Patient has already paid ₹{fee.toFixed(2)}
              </div>
              <div style={{ lineHeight: 1.5 }}>
                Since the patient paid and applied for this appointment, cancelling requires a <strong>100% money-back refund (₹{fee.toFixed(2)})</strong>. The refund will be immediately issued back to the patient.
              </div>
              {appointment.transactionId && (
                <div style={{ marginTop: 6, fontSize: '0.76rem', color: '#7f1d1d', fontFamily: 'monospace' }}>
                  Original Txn: {appointment.transactionId}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px',
              marginBottom: 16, fontSize: '0.84rem', color: '#475569'
            }}>
              Patient has not completed payment yet. Cancelling will immediately release this slot without any refund needed.
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#334155' }}>
              Reason for Cancellation <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Emergency surgery scheduled, doctor unavailable, schedule conflict..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="btn"
              style={{
                flex: 1.5,
                background: isPaid ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#334155',
                color: '#fff', border: 'none', fontWeight: 700
              }}
            >
              {loading ? 'Processing…' : isPaid ? `Confirm & Refund ₹${fee}` : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Appointments section ───────────────── */
function AppointmentsSection() {
  const navigate = useNavigate()
  const [appts, setAppts]   = useState([])
  const [adherenceAlerts, setAdherenceAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert]   = useState(null)
  const [actionId, setActionId] = useState(null)
  const [startingSession, setStartingSession] = useState(null)
  const [prescriptionAppt, setPrescriptionAppt] = useState(null)  // appointment for open modal
  const [cancellingAppt, setCancellingAppt] = useState(null)      // appointment for cancel & refund modal

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setAlert(null)
    try {
      const [data, alertsData] = await Promise.all([
        apiGetAllAppointments(),
        apiGetDoctorAdherenceAlerts().catch(() => []),
      ])
      setAdherenceAlerts(alertsData || [])
      // Filter out appointments whose slot date has already passed
      const today = new Date(); today.setHours(0,0,0,0)
      const active = (data || []).filter(a => {
        const slot = a.availabilitySlot
        if (!slot?.date) return true
        const slotDate = Array.isArray(slot.date)
          ? new Date(slot.date[0], slot.date[1]-1, slot.date[2])
          : new Date(slot.date)
        slotDate.setHours(0,0,0,0)
        return slotDate >= today
      })
      setAppts(active)
    } catch (err) {
      if (showSpinner) setAlert({ type: 'error', msg: err.message || 'Failed to load appointments.' })
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  // Auto-refresh every 2.5 seconds + WebSocket instant trigger
  useEffect(() => {
    load(true)
    const iv = setInterval(() => load(false), 2500)
    const onUpdate = () => load(false)
    window.addEventListener('doctor_appt_updated', onUpdate)
    return () => {
      clearInterval(iv)
      window.removeEventListener('doctor_appt_updated', onUpdate)
    }
  }, [load])

  async function handleAccept(id) {
    const target = appts.find(a => a.id === id)
    const patientName = target?.patientFullName || target?.patient?.username || 'Patient'
    setActionId(id)
    try {
      const updated = await apiAcceptAppointment(id)
      setAppts(prev => prev.map(a => a.id === id ? updated : a))
      setAlert({ type: 'info', msg: `Appointment #${id} for ${patientName} accepted.` })
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to accept appointment.' })
    } finally { setActionId(null) }
  }

  async function handleReject(id) {
    const target = appts.find(a => a.id === id)
    const patientName = target?.patientFullName || target?.patient?.username || 'Patient'
    setActionId(id)
    try {
      await apiRejectAppointment(id)
      setAppts(prev => prev.filter(a => a.id !== id))
      setAlert({ type: 'info', msg: `Appointment #${id} for ${patientName} rejected.` })
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to reject appointment.' })
    } finally { setActionId(null) }
  }

  const statusBadge = (status) => {
    const map = {
      PENDING:   <span className="badge badge-warning">⏳ Pending</span>,
      ACCEPTED:  <span className="badge badge-success">✅ Accepted</span>,
      REJECTED:  <span className="badge badge-error">❌ Rejected</span>,
      COMPLETED: <span className="badge badge-primary">🏁 Completed</span>,
      CANCELLED: <span className="badge">🚫 Cancelled</span>,
    }
    return map[status] || <span className="badge">{status}</span>
  }

  return (
    <div className="view-section">
      {/* Prescription modal */}
      {prescriptionAppt && (
        <PrescriptionModal
          appointment={prescriptionAppt}
          onClose={() => setPrescriptionAppt(null)}
        />
      )}

      {/* Doctor Cancel with Refund Modal */}
      {cancellingAppt && (
        <DoctorCancelRefundModal
          appointment={cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onSuccess={(res) => {
            const wasRefunded = res.paymentStatus === 'REFUNDED'
            setAlert({
              type: 'success',
              msg: wasRefunded
                ? `✅ Appointment #${res.id} cancelled. 100% full refund of ₹${res.refundAmount || 500} initiated (Refund ID: ${res.refundTransactionId || 'RFD-CONFIRMED'}).`
                : `✅ Appointment #${res.id} cancelled. Slot is now free.`
            })
            load()
          }}
        />
      )}

      {/* Medication Adherence Warning Alerts */}
      {adherenceAlerts.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {adherenceAlerts.map((al, idx) => (
            <div key={idx} style={{
              background: 'linear-gradient(135deg, #fef2f2, #ffe4e6)',
              border: '1.5px solid #f87171', borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12, color: '#991b1b',
              boxShadow: '0 4px 14px rgba(248,113,113,0.15)',
            }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Patient Adherence Alert: @{al.patientUsername}</div>
                <div style={{ fontSize: '0.8rem', marginTop: 2, color: '#7f1d1d' }}>{al.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="page-header-title">Appointment Requests</h2>
          <p className="page-header-sub">Review patient bookings, approve slots (6h payment window), or cancel with refund.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <Alert {...(alert || {})} msg={alert?.msg} onClose={() => setAlert(null)} />

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Queue #</th><th>ID</th><th>Patient</th><th>Full Name</th><th>Age</th><th>Phone</th><th>Sex</th><th>Health Issue</th><th>Date</th><th>Slot</th><th>Payment / Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={12}><div className="page-spinner"><span className="spinner" /> Loading…</div></td></tr>
                : appts.length === 0
                  ? <tr><td colSpan={12}><div className="empty-state">
                      <div className="empty-icon">🎉</div>
                      <div className="empty-title">No appointment requests yet</div>
                      <div className="empty-text">Patients who book your slots will appear here.</div>
                    </div></td></tr>
                  : appts.map(a => {
                      const slot = a.availabilitySlot || {}
                      const isPending = a.status === 'PENDING'
                      const isAccepted = a.status === 'ACCEPTED'
                      const isPaid = a.paymentStatus === 'PAID'
                      const isRefunded = a.paymentStatus === 'REFUNDED'
                      const isUnpaid = a.paymentStatus === 'UNPAID' || !a.paymentStatus
                      const isActing  = actionId === a.id
                      const deadlineInfo = getPaymentDeadlineInfo(a.paymentDeadline)

                      return (
                        <tr key={a.id}>
                          <td>
                            <span className="badge badge-primary" style={{ fontWeight: 800, fontSize: '0.78rem' }}>
                              #{a.queuePosition || a.id}
                            </span>
                          </td>
                          <td><strong>{a.id}</strong></td>
                          <td>{a.patient?.username || '—'}</td>
                          <td>{a.patientFullName || '—'}</td>
                          <td>{a.patientAge ?? '—'}</td>
                          <td>{a.patientPhone ? a.patientPhone.replace(/^undefined/, '') : '—'}</td>
                          <td>{a.patientSex || '—'}</td>
                          <td style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: '0.8rem' }}>{a.healthIssue || '—'}</td>
                          <td>{fmtDate(slot.date)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</td>
                          <td>
                            <div>
                              <div>{statusBadge(a.status)}</div>
                              {isPaid && (
                                <span className="badge badge-success" style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                                  ✓ Paid ₹{a.consultationFee || 500}
                                </span>
                              )}
                              {isRefunded && (
                                <div style={{ marginTop: 4 }}>
                                  <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800 }}>
                                    💰 Refunded ₹{a.refundAmount || a.consultationFee || 500}
                                  </span>
                                  {a.refundTransactionId && (
                                    <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'monospace', marginTop: 1 }}>
                                      {a.refundTransactionId}
                                    </div>
                                  )}
                                </div>
                              )}
                              {isAccepted && isUnpaid && (
                                <div style={{ marginTop: 4 }}>
                                  <span className="badge badge-warning" style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                                    ⏳ Unpaid
                                  </span>
                                  <div style={{ fontSize: '0.68rem', color: deadlineInfo?.expired ? '#ef4444' : '#b45309', marginTop: 2, fontWeight: 700 }}>
                                    {deadlineInfo ? (deadlineInfo.expired ? '❌ 6h window expired' : `⏱️ ${deadlineInfo.text}`) : 'Payment due in 6h'}
                                  </div>
                                </div>
                              )}
                              {isPending && isUnpaid && (
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                                  Unpaid (pays after accept)
                                </div>
                              )}
                              {a.cancellationReason && (a.status === 'CANCELLED' || a.status === 'REJECTED') && (
                                <div style={{ fontSize: '0.68rem', color: '#991b1b', marginTop: 3, maxWidth: 140, lineHeight: 1.2 }}>
                                  {a.cancellationReason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.78rem' }}
                                  onClick={() => handleAccept(a.id)}
                                  disabled={isActing}
                                  title="Accept booking request (starts 6-hour patient payment window)"
                                >
                                  {isActing ? '…' : <><CheckCircle size={12} /> Accept</>}
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.78rem', borderColor: '#f43f5e', color: '#f43f5e' }}
                                  onClick={() => handleReject(a.id)}
                                  disabled={isActing}
                                  title="Reject booking request without any refund"
                                >
                                  {isActing ? '…' : <><XCircle size={12} /> Reject</>}
                                </button>
                              </div>
                            ) : isAccepted ? (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {isPaid ? (
                                  <>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ width: 'auto', padding: '5px 12px', fontSize: '0.78rem', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 3px 10px rgba(124,58,237,0.35)' }}
                                      disabled={startingSession === a.id}
                                      onClick={async () => {
                                        setStartingSession(a.id)
                                        try {
                                          const s = await apiStartSession(a.id)
                                          navigate(`/session/${s.roomId}`)
                                        } catch (err) {
                                          setAlert({ type: 'error', msg: err.message || 'Could not start session.' })
                                          setStartingSession(null)
                                        }
                                      }}
                                    >
                                      {startingSession === a.id ? '…' : <><Video size={12} /> Start Session</>}
                                    </button>
                                    <button
                                      className="btn btn-sm"
                                      style={{ width: 'auto', padding: '5px 12px', fontSize: '0.78rem', background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.15))', border: '1.5px solid rgba(16,185,129,0.4)', color: '#065f46', display: 'flex', alignItems: 'center', gap: 5 }}
                                      onClick={() => setPrescriptionAppt(a)}
                                    >
                                      <ClipboardPlus size={12} /> Prescription
                                    </button>
                                    <button
                                      className="btn btn-outline btn-sm"
                                      style={{ width: 'auto', padding: '5px 10px', fontSize: '0.76rem', borderColor: '#fca5a5', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}
                                      onClick={() => setCancellingAppt(a)}
                                      title="Patient has paid. Cancelling requires issuing a 100% money-back refund."
                                    >
                                      <RotateCcw size={12} /> Cancel & Refund
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-sm"
                                      disabled
                                      style={{ width: 'auto', padding: '5px 10px', fontSize: '0.76rem', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1', cursor: 'not-allowed' }}
                                      title="Patient has not paid consultation fee yet (6-hour window active)"
                                    >
                                      <Video size={12} /> Awaiting Payment
                                    </button>
                                    <button
                                      className="btn btn-outline btn-sm"
                                      style={{ width: 'auto', padding: '5px 10px', fontSize: '0.76rem', borderColor: '#fca5a5', color: '#dc2626' }}
                                      onClick={() => setCancellingAppt(a)}
                                      title="Cancel appointment (no refund needed as unpaid)"
                                    >
                                      <XCircle size={12} /> Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : a.status === 'COMPLETED' ? (
                              <button
                                className="btn btn-sm"
                                style={{ width: 'auto', padding: '5px 12px', fontSize: '0.78rem', background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)', color: '#065f46', display: 'flex', alignItems: 'center', gap: 5 }}
                                onClick={() => setPrescriptionAppt(a)}
                              >
                                <ClipboardPlus size={12} /> Prescription
                              </button>
                            ) : <span style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-400)' }}>—</span>}
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Profile section ────────────────────── */
const EMPTY_FORM = {
  fullName: '', age: '', department: '', specialization: '',
  educationBackground: '', degrees: '', experienceSummary: '',
  memberships: '', awards: '', additionalNotes: '', photoBase64: '',
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--clr-neutral-400)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--clr-neutral-800)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  )
}

function ProfileSection({ onSaved }) {
  const username = getUsername()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [alert, setAlert]     = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const photoInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGetMyDoctorProfile()
      setProfile(data)
      setForm({
        fullName:            data.fullName            || '',
        age:                 data.age                 || '',
        department:          data.department          || '',
        specialization:      data.specialization      || '',
        educationBackground: data.educationBackground || '',
        degrees:             data.degrees             || '',
        experienceSummary:   data.experienceSummary   || '',
        memberships:         data.memberships         || '',
        awards:              data.awards              || '',
        additionalNotes:     data.additionalNotes     || '',
        photoBase64:         data.photoBase64         || '',
      })
      if (data.photoBase64) setPhotoPreview(data.photoBase64)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to load profile.' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age) : null }
      const saved = await apiSaveDoctorProfile(payload)
      setProfile(saved)
      if (saved.photoBase64) setPhotoPreview(saved.photoBase64)
      setEditing(false)
      setAlert({ type: 'success', msg: 'Profile saved successfully!' })
      if (onSaved) onSaved()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to save profile.' })
    } finally { setSaving(false) }
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'warning', msg: 'Please select an image file.' }); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAlert({ type: 'warning', msg: 'Image must be under 2 MB.' }); return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result
      setPhotoPreview(base64)
      setForm(f => ({ ...f, photoBase64: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const hasProfile = profile && (profile.fullName || profile.specialization || profile.department)

  if (loading) return <div className="page-spinner"><span className="spinner" /> Loading profile…</div>

  return (
    <div className="view-section">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-header-title">My Professional Profile</h2>
          <p className="page-header-sub">This information is visible to patients when they browse doctors.</p>
        </div>
        {!editing && (
          <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => { setEditing(true); setAlert(null) }}>
            <Edit3 size={13} /> {hasProfile ? 'Edit Profile' : 'Complete Profile'}
          </button>
        )}
      </div>

      <Alert {...(alert || {})} msg={alert?.msg} onClose={() => setAlert(null)} />

      {editing ? (
        /* ── Edit Mode ── */
        <form onSubmit={handleSave}>
          {/* Basic Info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title"><User size={15} /> Basic Information</div>
            </div>
            <div className="card-body">
              {/* Photo upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20, padding: '16px', background: 'var(--clr-neutral-50)', borderRadius: 10, border: '1px dashed var(--clr-neutral-300)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--clr-primary-300)' }} />
                    : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👨‍⚕️</div>
                  }
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--clr-primary-600)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Camera size={12} color="#fff" />
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--clr-neutral-700)', marginBottom: 3 }}>Profile Photo</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-neutral-500)' }}>Upload a clear, professional photo. Max 2 MB. JPG/PNG recommended.</div>
                  {photoPreview && (
                    <button type="button" style={{ marginTop: 6, fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photoBase64: '' })); if (photoInputRef.current) photoInputRef.current.value = '' }}
                    >✕ Remove photo</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input className="form-input" type="text" placeholder="e.g. Dr. Ramesh Kumar"
                    value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" min="22" max="90" placeholder="e.g. 42"
                    value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input className="form-input" type="text" placeholder="e.g. Cardiology"
                    value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Specialization <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input className="form-input" type="text" placeholder="e.g. Interventional Cardiologist"
                    value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} required />
                </div>
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title"><BookOpen size={15} /> Education & Degrees</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Education Background</label>
                  <textarea className="form-input" rows={4} placeholder="e.g. MBBS from AIIMS Delhi (2005)&#10;MD from PGI Chandigarh (2009)"
                    style={{ resize: 'vertical' }}
                    value={form.educationBackground} onChange={e => setForm(f => ({ ...f, educationBackground: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Degrees & Certifications</label>
                  <textarea className="form-input" rows={4} placeholder="e.g. MBBS, MD (Cardiology)&#10;FACC, FSCAI"
                    style={{ resize: 'vertical' }}
                    value={form.degrees} onChange={e => setForm(f => ({ ...f, degrees: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title"><Briefcase size={15} /> Experience</div>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Experience Summary</label>
                <textarea className="form-input" rows={5} placeholder="e.g. 15+ years of clinical experience in interventional cardiology.&#10;2010–2015: Senior Resident, Apollo Hospitals&#10;2015–2020: Consultant, Fortis Healthcare&#10;2020–present: Head of Cardiology, City Medical Centre"
                  style={{ resize: 'vertical' }}
                  value={form.experienceSummary} onChange={e => setForm(f => ({ ...f, experienceSummary: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Memberships & Awards */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title"><Award size={15} /> Memberships & Awards</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Memberships</label>
                  <textarea className="form-input" rows={4} placeholder="e.g. Fellow, American College of Cardiology&#10;Member, Indian Medical Association"
                    style={{ resize: 'vertical' }}
                    value={form.memberships} onChange={e => setForm(f => ({ ...f, memberships: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Awards & Recognitions</label>
                  <textarea className="form-input" rows={4} placeholder="e.g. Best Doctor Award, Apollo Hospitals (2018)&#10;Excellence in Research, IMA (2021)"
                    style={{ resize: 'vertical' }}
                    value={form.awards} onChange={e => setForm(f => ({ ...f, awards: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><Star size={15} /> Additional Notes</div>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Anything else you'd like patients to know</label>
                <textarea className="form-input" rows={3} placeholder="e.g. Fluent in English, Hindi, and Tamil. Available for second opinions."
                  style={{ resize: 'vertical' }}
                  value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
              {saving ? <><span className="btn-spinner" /> Saving…</> : <><Save size={14} /> Save Profile</>}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: 'auto' }}
              onClick={() => { setEditing(false); setAlert(null) }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      ) : (
        /* ── View Mode ── */
        !hasProfile ? (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-icon">🩺</div>
                <div className="empty-title">Profile not set up yet</div>
                <div className="empty-text">Click "Complete Profile" above to add your professional details. Patients will see this when browsing doctors.</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
            {/* Left — avatar card */}
            <div>
              <div className="card" style={{ textAlign: 'center', padding: '32px 20px', background: 'linear-gradient(145deg,#1e3a5f,#1e2235)', color: '#fff', border: 'none' }}>
                {/* Profile photo */}
                {profile.photoBase64
                  ? <img src={profile.photoBase64} alt="Dr profile" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginBottom: 16, border: '3px solid rgba(59,130,246,0.5)' }} />
                  : <div style={{ fontSize: '4.5rem', marginBottom: 16 }}>👨‍⚕️</div>
                }
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.15rem', marginBottom: 4 }}>
                  {profile.fullName || username}
                </div>
                {profile.age && (
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 10 }}>Age {profile.age}</div>
                )}
                {profile.specialization && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {profile.specialization}
                    </span>
                  </div>
                )}
                {profile.department && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.35)', color: '#5eead4', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
                      🏥 {profile.department}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', opacity: 0.55 }}>
                  {username}
                </div>
              </div>
              {/* Degrees card */}
              {profile.degrees && (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card-header"><div className="card-title" style={{ fontSize: '0.8rem' }}><BookOpen size={13} /> Degrees</div></div>
                  <div className="card-body" style={{ paddingTop: 10 }}>
                    {profile.degrees.split('\n').filter(Boolean).map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--clr-primary-50)', color: 'var(--clr-primary-700)', border: '1px solid var(--clr-primary-200)', borderRadius: 6, padding: '2px 8px' }}>{d.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Education */}
              {profile.educationBackground && (
                <div className="card">
                  <div className="card-header"><div className="card-title"><BookOpen size={15} /> Education Background</div></div>
                  <div className="card-body"><InfoRow value={profile.educationBackground} /></div>
                </div>
              )}
              {/* Experience */}
              {profile.experienceSummary && (
                <div className="card">
                  <div className="card-header"><div className="card-title"><Briefcase size={15} /> Experience</div></div>
                  <div className="card-body">
                    <div style={{ fontSize: '0.9rem', color: 'var(--clr-neutral-800)', whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                      {profile.experienceSummary}
                    </div>
                  </div>
                </div>
              )}
              {/* Memberships & Awards */}
              {(profile.memberships || profile.awards) && (
                <div className="card">
                  <div className="card-header"><div className="card-title"><Award size={15} /> Memberships & Awards</div></div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: profile.memberships && profile.awards ? '1fr 1fr' : '1fr', gap: 24 }}>
                      {profile.memberships && (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-neutral-500)', marginBottom: 10 }}>Memberships</div>
                          {profile.memberships.split('\n').filter(Boolean).map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.88rem' }}>
                              <span style={{ color: 'var(--clr-primary-500)', marginTop: 2 }}>🎖️</span>
                              <span>{m.trim()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {profile.awards && (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-neutral-500)', marginBottom: 10 }}>Awards</div>
                          {profile.awards.split('\n').filter(Boolean).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.88rem' }}>
                              <span style={{ marginTop: 2 }}>🏆</span>
                              <span>{a.trim()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Additional Notes */}
              {profile.additionalNotes && (
                <div className="card">
                  <div className="card-header"><div className="card-title"><Star size={15} /> Additional Notes</div></div>
                  <div className="card-body">
                    <div style={{ fontSize: '0.9rem', color: 'var(--clr-neutral-700)', fontStyle: 'italic', lineHeight: 1.7 }}>
                      "{profile.additionalNotes}"
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Security / Change Password */}
      <ChangePasswordCard />
    </div>
  )
}

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
      setAlert({ type: 'success', msg: '✅ Password updated successfully! Next time sign in with your new password.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to update password.' })
    } finally { setLoading(false) }
  }

  return (
    <div className="card" style={{ marginTop: 24, border: '1.5px solid var(--clr-primary-200)' }}>
      <div className="card-header" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff' }}>
        <div className="card-title" style={{ color: '#fff' }}>🔒 Security & Password Update</div>
      </div>
      <div className="card-body">
        {alert && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: '0.84rem',
            background: alert.type === 'success' ? '#f0fdf4' : alert.type === 'warning' ? '#fffbe6' : '#fef2f2',
            color: alert.type === 'success' ? '#166534' : alert.type === 'warning' ? '#854d0e' : '#991b1b',
            border: `1px solid ${alert.type === 'success' ? '#bbf7d0' : alert.type === 'warning' ? '#ffe58f' : '#fecaca'}`,
          }}>{alert.msg}</div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, maxWidth: 420 }}>
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
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ width: 'auto', marginTop: 4 }}>
            {loading ? 'Updating Password…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Emergency Alerts Section ────────── */
const SEVERITY_COLORS = {
  CRITICAL: { bg: 'linear-gradient(135deg,#7f1d1d,#991b1b)', badge: '#fca5a5', dot: '#ef4444' },
  HIGH:     { bg: 'linear-gradient(135deg,#92400e,#b45309)', badge: '#fcd34d', dot: '#f59e0b' },
  MEDIUM:   { bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)', badge: '#93c5fd', dot: '#3b82f6' },
}

function timeAgo(val) {
  if (!val) return ''
  const d = Array.isArray(val)
    ? new Date(val[0], val[1]-1, val[2], val[3]||0, val[4]||0)
    : new Date(val)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

function EmergencyAlertsSection() {
  const [alerts, setAlerts] = useState([])
  const [accepted, setAccepted] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [alert, setAlert] = useState(null)
  const [chatMap, setChatMap] = useState({})   // alertId -> message text
  const [chatLogs, setChatLogs] = useState({}) // alertId -> [{from,text,ts}]
  const [expandId, setExpandId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [open, acc] = await Promise.all([apiGetActiveEmergencies(), apiGetAcceptedByMe()])
      setAlerts(open || [])
      setAccepted(acc || [])
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time WebSocket listener + 5s polling fallback
  useEffect(() => {
    let client = null
    try {
      client = new Client({
        webSocketFactory: () => new SockJS(getWsUrl('/ws')),
        reconnectDelay: 3000,
        onConnect: () => {
          client.subscribe('/topic/emergency', (message) => {
            try {
              const newAlert = JSON.parse(message.body)
              if (newAlert && newAlert.id) {
                setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)])
              }
            } catch (e) {}
          })
        },
      })
      client.activate()
    } catch (e) {}

    const iv = setInterval(() => {
      apiGetActiveEmergencies().then(d => setAlerts(d || [])).catch(() => {})
    }, 5_000)

    return () => {
      clearInterval(iv)
      if (client) client.deactivate()
    }
  }, [load])

  async function handleAccept(id) {
    setActionId(id)
    try {
      const updated = await apiAcceptEmergency(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      setAccepted(prev => [updated, ...prev.filter(a => a.id !== id)])
      setAlert({ type: 'success', msg: `✅ You accepted emergency ID: ${id}. The patient has been notified.` })
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setActionId(null) }
  }

  async function handleResolve(id) {
    setActionId(id)
    try {
      const updated = await apiResolveEmergency(id)
      setAccepted(prev => prev.map(a => a.id === id ? updated : a))
      setAlert({ type: 'success', msg: `✅ Emergency ID: ${id} marked as resolved.` })
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setActionId(null) }
  }

  function sendChat(id) {
    const text = chatMap[id]?.trim()
    if (!text) return
    setChatLogs(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { from: 'Doctor (' + getUsername() + ')', text, ts: new Date().toLocaleTimeString() }]
    }))
    setChatMap(prev => ({ ...prev, [id]: '' }))
  }

  const sevColor = (sev) => SEVERITY_COLORS[sev] || SEVERITY_COLORS.MEDIUM

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">🚨 Emergency Alerts</h2>
          <p className="page-header-sub">Real-time emergency cases raised by patients. Accept to provide virtual assistance.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {alert && (
        <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:18, fontSize:'0.86rem',
          background: alert.type==='success'?'#f0fdf4':'#fef2f2',
          color: alert.type==='success'?'#166534':'#991b1b',
          border:`1px solid ${alert.type==='success'?'#bbf7d0':'#fecaca'}`, cursor:'pointer'
        }} onClick={() => setAlert(null)}>{alert.msg}</div>
      )}

      {/* Open alerts */}
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-header" style={{ background:'linear-gradient(135deg,#7f1d1d,#991b1b)', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0', border:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Siren size={16} color="#fca5a5" />
            <span style={{ fontWeight:700, color:'#fff', fontSize:'0.92rem' }}>Open Emergencies</span>
          </div>
          {alerts.length > 0 && (
            <span style={{ background:'#ef4444', color:'#fff', borderRadius:20, padding:'2px 10px', fontSize:'0.75rem', fontWeight:700, animation:'pulse 1.5s infinite' }}>
              {alerts.length} ACTIVE
            </span>
          )}
        </div>
        <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {loading
            ? <div className="page-spinner"><span className="spinner" /> Loading…</div>
            : alerts.length === 0
              ? <div className="empty-state" style={{ padding:'24px 0' }}>
                  <div className="empty-icon">🟢</div>
                  <div className="empty-title">No open emergencies</div>
                  <div className="empty-text">All clear! New patient alerts will appear here in real-time.</div>
                </div>
              : alerts.map(a => {
                const sc = sevColor(a.severity)
                return (
                  <div key={a.id} style={{ border:`2px solid ${a.severity==='CRITICAL'?'#ef4444':a.severity==='HIGH'?'#f59e0b':'#3b82f6'}`, borderRadius:14, overflow:'hidden', boxShadow:`0 4px 20px rgba(239,68,68,${a.severity==='CRITICAL'?'0.3':'0.1'})` }}>
                    <div style={{ background: sc.bg, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:'1.4rem', animation: a.severity==='CRITICAL'?'pulse 1s infinite':'' }}>{a.severity==='CRITICAL'?'🚨':a.severity==='HIGH'?'⚠️':'🔵'}</span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#fff' }}>Patient: {a.patient?.username}</div>
                          <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.7)', marginTop:2 }}>{timeAgo(a.createdAt)} · Alert ID: {a.id}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ background:sc.badge, color:'#111', borderRadius:20, padding:'3px 12px', fontSize:'0.72rem', fontWeight:800 }}>{a.severity}</span>
                        <button
                          className="btn btn-sm"
                          style={{ width:'auto', padding:'7px 18px', background:'#22c55e', color:'#fff', border:'none', fontWeight:700, fontSize:'0.82rem', borderRadius:20 }}
                          disabled={actionId===a.id}
                          onClick={() => handleAccept(a.id)}
                        >
                          {actionId===a.id?'Accepting…':'✓ Accept Emergency'}
                        </button>
                      </div>
                    </div>
                    <div style={{ padding:'14px 18px', background:'#fff' }}>
                      <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Symptoms</div>
                      <div style={{ fontSize:'0.9rem', color:'#111', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{a.symptoms}</div>
                      {a.location && <div style={{ marginTop:8, fontSize:'0.8rem', color:'#6b7280' }}>📍 {a.location}</div>}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Accepted alerts with chat */}
      {accepted.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><CheckCircle size={15} style={{ color:'#22c55e' }} /> My Accepted Cases</div>
            <span style={{ fontSize:'0.75rem', color:'var(--clr-neutral-400)' }}>{accepted.length} case(s)</span>
          </div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {accepted.map(a => {
              const isExpanded = expandId === a.id
              const isResolved = a.status === 'RESOLVED'
              return (
                <div key={a.id} style={{ border:'1.5px solid var(--clr-neutral-200)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background: isResolved?'#f0fdf4':'#eff6ff', cursor:'pointer' }}
                    onClick={() => setExpandId(isExpanded ? null : a.id)}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span>{isResolved?'✅':'🟡'}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.88rem' }}>Patient: {a.patient?.username} · ID: {a.id}</div>
                        <div style={{ fontSize:'0.72rem', color:'#6b7280' }}>{isResolved?'Resolved':'Active'} · {a.severity}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {!isResolved && (
                        <button
                          className="btn btn-sm"
                          style={{ width:'auto', padding:'5px 14px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', fontWeight:700, fontSize:'0.78rem', borderRadius:20 }}
                          disabled={actionId===a.id}
                          onClick={e => { e.stopPropagation(); handleResolve(a.id) }}
                        >
                          {actionId===a.id?'…':'✓ Mark Resolved'}
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding:'14px 16px', background:'#fff', borderTop:'1px solid #e5e7eb' }}>
                      <div style={{ fontWeight:700, fontSize:'0.78rem', color:'#6b7280', marginBottom:6 }}>SYMPTOMS</div>
                      <div style={{ fontSize:'0.88rem', color:'#111', marginBottom:14, whiteSpace:'pre-wrap' }}>{a.symptoms}</div>

                      {/* Precautionary chat */}
                      {!isResolved && (
                        <>
                          <div style={{ fontWeight:700, fontSize:'0.78rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Precautionary Advice</div>
                          <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 12px', minHeight:80, maxHeight:180, overflowY:'auto', marginBottom:10 }}>
                            {(chatLogs[a.id] || []).length === 0
                              ? <div style={{ color:'#9ca3af', fontSize:'0.8rem' }}>No messages yet. Type precautionary measures below.</div>
                              : (chatLogs[a.id] || []).map((m, i) => (
                                <div key={i} style={{ marginBottom:8, fontSize:'0.82rem' }}>
                                  <span style={{ fontWeight:700, color:'#2563eb' }}>{m.from}</span>
                                  <span style={{ color:'#6b7280', marginLeft:6, fontSize:'0.7rem' }}>{m.ts}</span>
                                  <div style={{ color:'#111', marginTop:2 }}>{m.text}</div>
                                </div>
                              ))}
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <input
                              className="form-input"
                              style={{ flex:1, background:'#fff', color:'#111', border:'1.5px solid #d1d5db', fontSize:'0.88rem' }}
                              placeholder="Type precautionary advice…"
                              value={chatMap[a.id] || ''}
                              onChange={e => setChatMap(prev => ({ ...prev, [a.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && sendChat(a.id)}
                            />
                            <button
                              onClick={() => sendChat(a.id)}
                              style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', border:'none', borderRadius:10, padding:'0 14px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:5 }}
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Branded Project Confirmation Modal ── */
function ProjectConfirmModal({ isOpen, title = "Confirm Action", message, confirmText = "Confirm", cancelText = "Cancel", confirmVariant = "danger", onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px 28px',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
        animation: 'fadeInUp 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: confirmVariant === 'danger' ? '#fef2f2' : '#eff6ff',
            color: confirmVariant === 'danger' ? '#ef4444' : '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
            border: confirmVariant === 'danger' ? '1px solid #fecaca' : '1px solid #bfdbfe'
          }}>
            {confirmVariant === 'danger' ? '🗑️' : '❓'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>MediCare Confirmation</span>
          </div>
        </div>
        <p style={{ margin: '0 0 22px 0', fontSize: '0.92rem', color: '#475569', lineHeight: 1.55 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
              background: confirmVariant === 'danger' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff', border: 'none',
              boxShadow: confirmVariant === 'danger' ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px rgba(37,99,235,0.35)',
              cursor: 'pointer'
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Articles Section ────────────────── */
const ARTICLE_CATEGORIES = [
  'GENERAL_HEALTH','NUTRITION','MENTAL_HEALTH','CARDIOLOGY',
  'DIABETES','FITNESS','COVID','PEDIATRICS','OTHER'
]

const EMPTY_ARTICLE = { title:'', category:'GENERAL_HEALTH', content:'', coverImageBase64:'' }

function ArticlesSection() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)  // article being edited
  const [form, setForm] = useState({ ...EMPTY_ARTICLE })
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [previewArticle, setPreviewArticle] = useState(null)
  const [articleToDelete, setArticleToDelete] = useState(null)
  const coverRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setArticles(await apiGetMyArticles() || []) }
    catch (err) { setAlert({ type:'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_ARTICLE })
    setShowForm(true)
    setAlert(null)
  }

  function openEdit(art) {
    setEditing(art)
    setForm({ title: art.title, category: art.category, content: art.content, coverImageBase64: art.coverImageBase64 || '' })
    setShowForm(true)
    setAlert(null)
  }

  function handleCoverChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setAlert({ type:'warning', msg:'Cover image must be under 3 MB.' }); return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, coverImageBase64: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setAlert({ type:'warning', msg:'Title and content are required.' }); return
    }
    setSaving(true); setAlert(null)
    try {
      if (editing) {
        const updated = await apiUpdateArticle(editing.id, form)
        setArticles(prev => prev.map(a => a.id === editing.id ? updated : a))
        setAlert({ type:'success', msg:'✅ Article updated.' })
      } else {
        const created = await apiCreateArticle(form)
        setArticles(prev => [created, ...prev])
        setAlert({ type:'success', msg:'✅ Article published!' })
      }
      setShowForm(false)
    } catch (err) { setAlert({ type:'error', msg: err.message }) }
    finally { setSaving(false) }
  }

  async function confirmDeleteArticle() {
    if (!articleToDelete) return
    const id = articleToDelete.id
    const title = articleToDelete.title
    setArticleToDelete(null)
    try {
      await apiDeleteArticle(id)
      setArticles(prev => prev.filter(a => a.id !== id))
      setAlert({ type:'success', msg:`Article "${title}" deleted.` })
    } catch (err) { setAlert({ type:'error', msg: err.message || 'Failed to delete article.' }) }
  }

  const catLabel = (c) => c.replace(/_/g,' ')

  if (previewArticle) {
    return (
      <div className="view-section">
        <button className="btn btn-outline btn-sm" style={{ width:'auto', marginBottom:20 }} onClick={() => setPreviewArticle(null)}>
          ← Back to My Articles
        </button>
        {previewArticle.coverImageBase64 && (
          <img src={previewArticle.coverImageBase64} alt="cover" style={{ width:'100%', maxHeight:280, objectFit:'cover', borderRadius:16, marginBottom:20 }} />
        )}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{catLabel(previewArticle.category)}</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.6rem', fontWeight:800, color:'var(--clr-neutral-900)', lineHeight:1.3, marginBottom:16 }}>{previewArticle.title}</h2>
            <div style={{ fontSize:'0.82rem', color:'#6b7280', marginBottom:24 }}>By Dr. {previewArticle.doctor?.username} · {new Date(Array.isArray(previewArticle.publishedAt)?new Date(previewArticle.publishedAt[0],previewArticle.publishedAt[1]-1,previewArticle.publishedAt[2]):previewArticle.publishedAt).toLocaleDateString('en-IN',{dateStyle:'medium'})}</div>
            <div style={{ fontSize:'0.95rem', lineHeight:1.85, color:'var(--clr-neutral-800)', whiteSpace:'pre-wrap' }}>{previewArticle.content}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="view-section">
      {/* Custom Confirmation Modal */}
      <ProjectConfirmModal
        isOpen={!!articleToDelete}
        title="Delete Health Article"
        message={`Are you sure you want to delete "${articleToDelete?.title}"? This action cannot be undone and it will be removed from the patient health feed.`}
        confirmText="Delete Article"
        confirmVariant="danger"
        onConfirm={confirmDeleteArticle}
        onCancel={() => setArticleToDelete(null)}
      />

      <div className="page-header">
        <div>
          <h2 className="page-header-title">📝 My Health Articles</h2>
          <p className="page-header-sub">Publish health articles and social health awareness posts for patients.</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ width:'auto', background:'linear-gradient(135deg,#2563eb,#1d4ed8)' }} onClick={openCreate}>
          <Plus size={13} /> New Article
        </button>
      </div>

      {alert && (
        <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:18, fontSize:'0.86rem',
          background: alert.type==='success'?'#f0fdf4':alert.type==='warning'?'#fefce8':'#fef2f2',
          color: alert.type==='success'?'#166534':alert.type==='warning'?'#854d0e':'#991b1b',
          border:`1px solid ${alert.type==='success'?'#bbf7d0':alert.type==='warning'?'#fde047':'#fecaca'}`, cursor:'pointer'
        }} onClick={() => setAlert(null)}>{alert.msg}</div>
      )}

      {/* Article form */}
      {showForm && (
        <div className="card" style={{ marginBottom:22, border:'2px solid var(--clr-primary-300)', boxShadow:'0 4px 24px rgba(37,99,235,0.12)' }}>
          <div className="card-header" style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0', border:'none' }}>
            <div style={{ fontWeight:800, color:'#fff', fontSize:'0.95rem', display:'flex', alignItems:'center', gap:8 }}>
              <Newspaper size={16} /> {editing ? 'Edit Article' : 'Write New Article'}
            </div>
            <button onClick={() => { setShowForm(false); setAlert(null) }} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'5px 10px', color:'#fff', cursor:'pointer' }}>
              <X size={15} />
            </button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Article Title *</label>
                  <input className="form-input" style={{ background:'#fff', color:'#111', border:'1.5px solid #d1d5db' }} placeholder="e.g. 5 Tips to Prevent Diabetes" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Category *</label>
                  <select className="form-input" style={{ background:'#fff', color:'#111', border:'1.5px solid #d1d5db' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {ARTICLE_CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Content *</label>
                <textarea className="form-input" rows={10} style={{ resize:'vertical', background:'#fff', color:'#111', border:'1.5px solid #d1d5db', lineHeight:1.7 }}
                  placeholder="Write your health article here… Share your expertise, tips, awareness, or precautionary advice."
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, padding:'12px 14px', background:'#f8fafc', borderRadius:10, border:'1px dashed #d1d5db' }}>
                {form.coverImageBase64
                  ? <img src={form.coverImageBase64} alt="cover" style={{ width:80, height:55, objectFit:'cover', borderRadius:8 }} />
                  : <div style={{ width:80, height:55, background:'#e5e7eb', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>🖼️</div>
                }
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#374151', marginBottom:3 }}>Cover Image (optional)</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button type="button" style={{ background:'var(--clr-primary-50)', border:'1px solid var(--clr-primary-200)', borderRadius:8, padding:'4px 12px', color:'var(--clr-primary-700)', fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }} onClick={() => coverRef.current?.click()}>Upload Image</button>
                    {form.coverImageBase64 && <button type="button" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'4px 12px', color:'#ef4444', fontSize:'0.78rem', cursor:'pointer' }} onClick={() => setForm(f => ({ ...f, coverImageBase64:'' }))}>Remove</button>}
                    <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleCoverChange} />
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary" style={{ width:'auto', background:'linear-gradient(135deg,#2563eb,#1d4ed8)' }} disabled={saving}>
                  {saving ? <><span className="btn-spinner" /> Saving…</> : <><FileEdit size={14} /> {editing?'Update Article':'Publish Article'}</>}
                </button>
                <button type="button" className="btn btn-ghost" style={{ width:'auto' }} onClick={() => { setShowForm(false); setAlert(null) }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles list */}
      {loading
        ? <div className="page-spinner"><span className="spinner" /> Loading articles…</div>
        : articles.length === 0
          ? <div className="card"><div className="card-body"><div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">No articles yet</div>
              <div className="empty-text">Click "New Article" to write your first health post. Your articles will appear in the patient Health Feed.</div>
            </div></div></div>
          : <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {articles.map(art => (
                <div key={art.id} className="card" style={{ display:'flex', gap:0, overflow:'hidden' }}>
                  {art.coverImageBase64 && (
                    <img src={art.coverImageBase64} alt="cover" style={{ width:160, objectFit:'cover', flexShrink:0 }} />
                  )}
                  <div style={{ flex:1, padding:'18px 20px' }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{catLabel(art.category)}</div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.05rem', color:'var(--clr-neutral-900)', marginBottom:6 }}>{art.title}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--clr-neutral-600)', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginBottom:12 }}>{art.content}</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button className="btn btn-outline btn-sm" style={{ width:'auto', padding:'5px 12px' }} onClick={() => setPreviewArticle(art)}><BookOpen size={12} /> Preview</button>
                      <button className="btn btn-sm" style={{ width:'auto', padding:'5px 12px', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.2)', color:'#2563eb' }} onClick={() => openEdit(art)}><Edit3 size={12} /> Edit</button>
                      <button className="btn btn-sm" style={{ width:'auto', padding:'5px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444' }} onClick={() => setArticleToDelete(art)}><Trash2 size={12} /> Delete</button>
                      <span style={{ marginLeft:'auto', fontSize:'0.72rem', color:'#9ca3af' }}>❤️ {art.likesCount||0} likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}

/* ── DoctorDash (main export) ───────────── */
export default function DoctorDash() {
  const [view, setView] = useState('schedule')
  const [profileComplete, setProfileComplete] = useState(false)
  const [emergencyCount, setEmergencyCount] = useState(0)
  const username = getUsername()

  useEffect(() => {
    apiGetMyDoctorProfile()
      .then(data => {
        const isComplete = !!(data && (data.fullName || data.specialization || data.department))
        setProfileComplete(isComplete)
      })
      .catch(() => {})
    // Poll for emergency count badge every 5 seconds + WebSocket
    const pollEmergency = () =>
      apiGetActiveEmergencies().then(d => setEmergencyCount((d||[]).length)).catch(() => {})
    pollEmergency()
    const iv = setInterval(pollEmergency, 5_000)

    let client = null
    try {
      client = new Client({
        webSocketFactory: () => new SockJS(getWsUrl('/ws')),
        reconnectDelay: 3000,
        onConnect: () => {
          client.subscribe('/topic/emergency', () => pollEmergency())
          client.subscribe(`/topic/doctor-notifications/${username}`, () => {
            window.dispatchEvent(new CustomEvent('doctor_appt_updated'))
          })
          client.subscribe('/topic/appointments', () => {
            window.dispatchEvent(new CustomEvent('doctor_appt_updated'))
          })
        },
      })
      client.activate()
    } catch (e) {}

    return () => {
      clearInterval(iv)
      if (client) client.deactivate()
    }
  }, [])

  const navItems = [
    { id: 'schedule',      label: 'My Schedule',         icon: <Calendar size={16} /> },
    { id: 'appointments',  label: 'Appointment Requests', icon: <ClipboardList size={16} /> },
    { id: 'emergency',     label: 'Emergency Alerts',     icon: <span style={{ position:'relative', display:'inline-flex' }}><Siren size={16} />{emergencyCount > 0 && <span style={{ position:'absolute', top:-6, right:-8, background:'#ef4444', color:'#fff', borderRadius:'50%', width:14, height:14, fontSize:'0.6rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 1.5s infinite' }}>{emergencyCount}</span>}</span> },
    { id: 'articles',      label: 'My Articles',          icon: <Newspaper size={16} /> },
  ]

  const titles = {
    schedule:     'My Schedule',
    appointments: 'Appointment Requests',
    emergency:    'Emergency Alerts',
    articles:     'My Health Articles',
    profile:      'My Profile',
  }

  return (
    <DashLayout role="DOCTOR" activeView={view} setActiveView={setView} navItems={navItems} topbarTitle={titles[view]}>
      {/* Profile completion nudge banner */}
      {!profileComplete && view !== 'profile' && (
        <div style={{
          margin: '0 0 0 0',
          padding: '12px 24px',
          background: 'linear-gradient(90deg,rgba(245,158,11,0.12),rgba(234,88,12,0.08))',
          borderBottom: '1px solid rgba(245,158,11,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: '0.85rem',
          color: 'var(--clr-neutral-700)',
        }}>
          <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#92400e' }}>Your professional profile is incomplete.</strong>{' '}
            Patients see your profile when choosing a doctor — complete it to get more bookings.
          </span>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: 'auto', marginLeft: 'auto', background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 3px 10px rgba(245,158,11,0.35)', flexShrink: 0 }}
            onClick={() => setView('profile')}
          >
            Complete Profile
          </button>
        </div>
      )}
      {view === 'schedule'     && <ScheduleSection profileComplete={profileComplete} onGoToProfile={() => setView('profile')} />}
      {view === 'appointments' && <AppointmentsSection />}
      {view === 'emergency'    && <EmergencyAlertsSection />}
      {view === 'articles'     && <ArticlesSection />}
      {view === 'profile'      && <ProfileSection onSaved={() => setProfileComplete(true)} />}
    </DashLayout>
  )
}
