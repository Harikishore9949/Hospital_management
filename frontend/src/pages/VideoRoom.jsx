/**
 * VideoRoom.jsx
 * Google Meet User Interface & Instant Video Consultation Room.
 *
 * Features & Fixes:
 *  - Project-themed confirmation modals (replacing ugly native browser confirm alerts)
 *  - Persistent video DOM elements so camera toggle off/on never becomes blank
 *  - Real-time instant document sync (uploads/deletions update doctor view live without refresh)
 *  - Clickable document items that open directly in a new browser tab
 *  - In-meeting Doctor Prescription Modal (Doctor can issue prescription directly from the call)
 *  - Real-time notification to patient when doctor issues prescription
 *  - Audio echo cancellation & track handling to ensure clear two-way sound
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, FileText, X, Upload,
  Trash2, Eye, AlertTriangle, Users, MoreVertical,
  Hand, Settings, Check, Copy, ClipboardPlus, FlaskConical,
  RefreshCw,
} from 'lucide-react'
import {
  getToken, getUsername, getRole,
  apiCheckRoom, apiEndSession,
  apiGetMyDocuments, apiGetSessionDocuments,
  apiUploadDocument, apiDeleteDocument, apiDocFileUrl,
  apiIssuePrescription, apiGetPrescriptionByAppt,
  apiGetMyLabOrders, getWsUrl, safeShowNotification,
} from '../api'
import './VideoRoom.css'

// ── STUN / ICE config ──────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

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

// ── File helpers ──────────────────────────────────────────────────────────
function fileIcon(mime) {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.includes('pdf'))      return '📕'
  if (mime.includes('word') || mime.includes('document')) return '📝'
  if (mime.includes('sheet') || mime.includes('excel'))   return '📊'
  return '📄'
}
function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Session timer hook ────────────────────────────────────────────────────
function useTimer(running) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// ── Project Theme Confirmation Modal ──────────────────────────────────────
function ConfirmModal({ isOpen, title, icon, message, confirmText, confirmVariant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', animation: 'fadeIn 0.18s ease',
    }} onClick={onCancel}>
      <div style={{
        background: '#303134', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18, padding: '24px 28px', maxWidth: 440, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', color: '#e8eaed',
        animation: 'fadeInUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon || '⚠️'} {title}
        </div>
        <div style={{ fontSize: '0.88rem', color: '#bdc1c6', lineHeight: 1.5, marginBottom: 24 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: '#e8eaed', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: confirmVariant === 'danger' ? '#ea4335' : '#1a73e8',
              color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: confirmVariant === 'danger' ? '0 4px 14px rgba(234,67,53,0.4)' : '0 4px 14px rgba(26,115,232,0.4)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Notification toast component ──────────────────────────────────────────
function NotifToast({ notifs, onDismiss }) {
  return (
    <div className="vroom-notif-stack">
      {notifs.map(n => (
        <div key={n.id} className={`vroom-notif${n.exiting ? ' exit' : ''}`}>
          <div className="vroom-notif-icon">{n.icon}</div>
          <div className="vroom-notif-body">
            <div className="vroom-notif-title">{n.title}</div>
            <div className="vroom-notif-msg">{n.msg}</div>
          </div>
          <button className="vroom-notif-close" onClick={() => onDismiss(n.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Microphone Speech Dictation Helper ────────────────────────────────────
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
        background: listening ? '#ef4444' : 'rgba(37,99,235,0.1)',
        color: listening ? '#fff' : '#2563eb',
        border: listening ? '1px solid #dc2626' : '1px solid rgba(37,99,235,0.3)',
        borderRadius: 6,
        padding: '2px 8px',
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
      <span>{listening ? 'Listening…' : '🎙️ Dictate'}</span>
    </button>
  )
}

// ── In-Meeting Prescription Modal ──────────────────────────────────────────
function PrescriptionModal({ appointmentId, patientName, onClose, onPrescriptionIssued }) {
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }])
  const [saving, setSaving]       = useState(false)
  const [alert, setAlert]         = useState(null)
  const [existing, setExisting]   = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  useEffect(() => {
    if (!appointmentId) { setLoadingExisting(false); return }
    apiGetPrescriptionByAppt(appointmentId)
      .then(data => { setExisting(data); populateFromExisting(data) })
      .catch(() => setExisting(null))
      .finally(() => setLoadingExisting(false))
  }, [appointmentId])

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
      await apiIssuePrescription(appointmentId, {
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
      onPrescriptionIssued?.()
      setTimeout(onClose, 1200)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to issue prescription.' })
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease', color: '#111',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#ffffff', borderRadius: 18, width: '92%', maxWidth: 680,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1.5px solid #e5e7eb',
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
          borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              💊 Issue Prescription to Patient
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Patient: <strong style={{ color: '#fff' }}>{patientName || 'Patient'}</strong> (Appt ID: {appointmentId})
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '22px 24px' }}>
          {loadingExisting ? (
            <div style={{ textAlign: 'center', padding: 20 }}>⏳ Loading prescription details…</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {existing && (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#1e40af' }}>
                  ℹ️ A prescription already exists for this appointment — submitting will replace it.
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {medicines.map((med, i) => (
                  <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px', background: '#fafafa', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#4b5563', textTransform: 'uppercase' }}>Medicine {i + 1}</span>
                      {medicines.length > 1 && (
                        <button type="button" onClick={() => removeMed(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Medicine Name *</label>
                          <SpeechDictationButton onTranscript={text => updateMed(i, 'medicineName', (med.medicineName ? med.medicineName + ' ' : '') + text)} />
                        </div>
                        <input className="form-input" style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem', width: '100%', padding: '8px 12px', borderRadius: 8 }}
                          placeholder="e.g. Paracetamol" value={med.medicineName} onChange={e => updateMed(i, 'medicineName', e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Dosage *</label>
                        <input className="form-input" style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem', width: '100%', padding: '8px 12px', borderRadius: 8 }}
                          placeholder="e.g. 500mg" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Times / Day *</label>
                        <select className="form-input" style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem', width: '100%', padding: '8px 12px', borderRadius: 8 }}
                          value={med.timesPerDay} onChange={e => updateMed(i, 'timesPerDay', e.target.value)}>
                          <option value="1">1 × daily</option>
                          <option value="2">2 × daily</option>
                          <option value="3">3 × daily</option>
                          <option value="4">4 × daily</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Duration (Days) *</label>
                        <input type="number" min="1" max="365" className="form-input" style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem', width: '100%', padding: '8px 12px', borderRadius: 8 }}
                          placeholder="e.g. 5" value={med.durationDays || ''} onChange={e => updateMed(i, 'durationDays', e.target.value)} required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                          Scheduled Times <span style={{ fontWeight: 400, color: '#2563eb' }}>(e.g. 08:00 AM, 08:00 PM)</span>
                        </label>
                        <input className="form-input" style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem', width: '100%', padding: '8px 12px', borderRadius: 8 }}
                          placeholder="08:00 AM, 08:00 PM" value={med.scheduledTimes}
                          onChange={e => updateMed(i, 'scheduledTimes', e.target.value)}
                          onBlur={e => updateMed(i, 'scheduledTimes', normalizeTimesWithAmPm(e.target.value))}
                          required />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Instructions</label>
                          <SpeechDictationButton onTranscript={text => updateMed(i, 'instructions', (med.instructions ? med.instructions + ' ' : '') + text)} />
                        </div>
                        <input className="form-input" style={{ background: '#fff', color: '#111', border: '1.5px solid #d1d5db', fontSize: '0.88rem', width: '100%', padding: '8px 12px', borderRadius: 8 }}
                          placeholder="e.g. After meals" value={med.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
                <button type="button" onClick={addMed} style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.3)', padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                  + Add Another Medicine
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', color: '#fff', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Saving…' : 'Issue Prescription'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Google Meet Side Panel (Documents & People) ───────────────────────────
function MeetSidePanel({ roomId, role, appointmentId, activeTab, setActiveTab, onClose, sessionInfo, notifyDocChange, reloadKey }) {
  const [docs, setDocs]           = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadAlert, setUploadAlert] = useState(null)
  const [dragging, setDragging]   = useState(false)
  const [deleteDocId, setDeleteDocId] = useState(null)
  const [labOrders, setLabOrders] = useState([])
  const fileInputRef = useRef(null)
  const isPatient = role === 'PATIENT'
  const isDoctor  = role === 'DOCTOR'

  const loadDocs = useCallback(async () => {
    try {
      if (isPatient) {
        const data = await apiGetMyDocuments()
        setDocs(data || [])
      } else if (isDoctor) {
        const data = await apiGetSessionDocuments(roomId)
        setDocs(data || [])
      }
    } catch { setDocs([]) }
  }, [isPatient, isDoctor, roomId])

  useEffect(() => { loadDocs() }, [loadDocs, reloadKey])

  useEffect(() => {
    if (isPatient) {
      apiGetMyLabOrders()
        .then(list => setLabOrders((list || []).filter(o => o.status === 'COMPLETED')))
        .catch(() => {})
    }
  }, [isPatient])

  function attachLabReport(labOrder) {
    let biomarkerText = ''
    try {
      const items = JSON.parse(labOrder.resultsJson || '[]')
      biomarkerText = items.map(b => `  - ${b.name.padEnd(25)}: ${b.value} ${b.unit || ''} (Ref: ${b.range || 'Normal'}) [${b.status || 'NORMAL'}]`).join('\n')
    } catch {
      biomarkerText = '  - Laboratory verified specimen record attached.'
    }

    const content = `======================================================================
MEDICARE MULTISPECIALTY HOSPITAL - CLINICAL PATHOLOGY REPORT
NABL ISO 15189:2022 Certified Reference Laboratory
======================================================================
Investigation   : ${labOrder.testName}
Discipline      : ${labOrder.testCategory || 'Diagnostics'}
Order / Barcode : #${labOrder.id}
Patient Name    : ${getUsername()}
Sample Mode     : ${labOrder.collectionType === 'HOME_COLLECTION' ? 'Home Phlebotomy' : 'Hospital Center'}
Report Date     : ${new Date().toLocaleString()}
Lab Facility    : ${labOrder.labCenterName || 'Central Diagnostics'}
Pathologist     : ${labOrder.pathologistName || 'Dr. Anita Roy, MD (Pathology)'}
----------------------------------------------------------------------
BIOMARKER FINDINGS & ANALYSIS:
${biomarkerText}
----------------------------------------------------------------------
Clinical Interpretation & Quality Remarks:
${labOrder.notes || 'All quality controls in range. Correlate with clinical diagnosis.'}
======================================================================
Electronic Signature Verified: ${labOrder.pathologistName || 'Dr. Anita Roy, MD (Pathology)'}
`

    const blob = new Blob([content], { type: 'text/plain' })
    const filename = `${labOrder.testName.replace(/[^a-zA-Z0-9]/g, '_')}_LabReport.txt`
    const file = new File([blob], filename, { type: 'text/plain' })
    handleUpload(file)
  }

  async function handleUpload(file) {
    if (!file) return
    setUploading(true); setUploadAlert(null)
    try {
      await apiUploadDocument(file, appointmentId)
      setUploadAlert({ type: 'success', msg: `"${file.name}" uploaded successfully!` })
      await loadDocs()
      notifyDocChange?.()
    } catch (err) {
      setUploadAlert({ type: 'error', msg: err.message || 'Upload failed.' })
    } finally { setUploading(false) }
  }

  async function confirmDeleteDoc() {
    if (!deleteDocId) return
    const id = deleteDocId
    setDeleteDocId(null)
    try {
      await apiDeleteDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
      notifyDocChange?.()
    } catch (err) { setUploadAlert({ type: 'error', msg: 'Delete failed: ' + err.message }) }
  }

  function openFile(id) {
    const token = getToken()
    fetch(apiDocFileUrl(id), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Could not fetch document bytes. Check permissions.')
        return r.blob()
      })
      .then(blob => window.open(URL.createObjectURL(blob), '_blank'))
      .catch(err => setUploadAlert({ type: 'error', msg: err.message || 'Could not open file.' }))
  }

  return (
    <div className="vroom-side-panel">
      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteDocId}
        title="Delete Medical Document"
        icon="🗑️"
        message="Are you sure you want to delete this document? It will be removed from this consultation session."
        confirmText="Delete Document"
        confirmVariant="danger"
        onConfirm={confirmDeleteDoc}
        onCancel={() => setDeleteDocId(null)}
      />

      {/* Google Meet side header */}
      <div className="vroom-panel-header">
        <div className="vroom-panel-tabs">
          <button
            className={`vroom-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <FileText size={15} /> Medical Docs
          </button>
          <button
            className={`vroom-tab-btn ${activeTab === 'people' ? 'active' : ''}`}
            onClick={() => setActiveTab('people')}
          >
            <Users size={15} /> People
          </button>
        </div>
        <button className="vroom-panel-close" onClick={onClose} title="Close panel">
          <X size={16} />
        </button>
      </div>

      {/* Tab 1: Documents */}
      {activeTab === 'docs' && (
        <div className="vroom-docs-body">
          {isPatient && (
            <>
              {uploadAlert && (
                <div className={`vroom-alert-box ${uploadAlert.type}`}>
                  {uploadAlert.msg}
                </div>
              )}
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  Option 1: Upload directly from system
                </div>
                <label
                  className={`vroom-upload-area${dragging ? ' drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files[0]) }}
                >
                  <input ref={fileInputRef} type="file" accept="*/*"
                    onChange={e => handleUpload(e.target.files[0])} />
                  <div className="vroom-upload-icon">📎</div>
                  <div className="vroom-upload-text">
                    <strong>Click to upload</strong> or drag & drop<br />
                    PDF, images, Word, Excel (max 20 MB)
                  </div>
                  <button className="vroom-upload-btn" type="button" disabled={uploading}
                    onClick={e => { e.preventDefault(); fileInputRef.current?.click() }}>
                    <Upload size={13} /> {uploading ? 'Uploading…' : 'Choose File'}
                  </button>
                  {uploading && (
                    <div className="vroom-upload-progress">
                      <div className="vroom-upload-progress-bar" />
                    </div>
                  )}
                </label>
                {labOrders.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 6 }}>
                      Option 2: Attach from Verified Diagnostic Lab Reports
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {labOrders.map(lo => (
                        <button
                          key={lo.id}
                          type="button"
                          disabled={uploading}
                          onClick={() => attachLabReport(lo)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 8,
                            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                            color: '#93c5fd', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                            textAlign: 'left', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FlaskConical size={13} color="#60a5fa" />
                            <span>{lo.testName}</span>
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700 }}>
                            + Attach to Call
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {isDoctor && (
            <div className="vroom-doctor-note">
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Patient documents update in <strong>real-time</strong>. Access automatically expires when session ends.</span>
            </div>
          )}

          <div className="vroom-docs-list">
            {docs.length === 0 ? (
              <div className="vroom-docs-empty">
                <div className="empty-icon">📂</div>
                <p>{isPatient ? 'No documents uploaded yet' : 'Patient has no uploaded documents'}</p>
              </div>
            ) : docs.map(doc => (
              <div key={doc.id} className="vroom-doc-item" onClick={() => openFile(doc.id)} style={{ cursor: 'pointer' }}>
                <span className="vroom-doc-icon">{fileIcon(doc.mimeType)}</span>
                <div className="vroom-doc-info">
                  <div className="vroom-doc-name" title={doc.originalName}>{doc.originalName}</div>
                  <div className="vroom-doc-meta">{fmtSize(doc.fileSize)} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</div>
                </div>
                <div className="vroom-doc-actions" onClick={e => e.stopPropagation()}>
                  <button className="vroom-doc-btn vroom-doc-view" onClick={(e) => { e.stopPropagation(); openFile(doc.id) }} title="View Document">
                    <Eye size={13} />
                  </button>
                  {isPatient && (
                    <button className="vroom-doc-btn vroom-doc-delete" onClick={(e) => { e.stopPropagation(); setDeleteDocId(doc.id) }} title="Delete Document">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: People */}
      {activeTab === 'people' && (
        <div className="vroom-people-body">
          <div className="vroom-people-section-title">In this call</div>
          
          <div className="vroom-person-item">
            <div className="vroom-person-avatar">👨‍⚕️</div>
            <div className="vroom-person-info">
              <div className="vroom-person-name">Dr. {sessionInfo?.doctorName || 'Doctor'}</div>
              <div className="vroom-person-role">Consulting Doctor</div>
            </div>
            {role === 'DOCTOR' && <span className="vroom-you-badge">You</span>}
          </div>

          <div className="vroom-person-item">
            <div className="vroom-person-avatar">🧑‍🤝‍🧑</div>
            <div className="vroom-person-info">
              <div className="vroom-person-name">{sessionInfo?.patientName || 'Patient'}</div>
              <div className="vroom-person-role">Patient</div>
            </div>
            {role === 'PATIENT' && <span className="vroom-you-badge">You</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main VideoRoom component ───────────────────────────────────────────────
export default function VideoRoom() {
  const { roomId }  = useParams()
  const navigate    = useNavigate()
  const username    = getUsername()
  const role        = getRole()

  // Session
  const [sessionInfo, setSessionInfo] = useState(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [initError, setInitError] = useState(null)

  // Media
  const [micOn, setMicOn]         = useState(true)
  const [camOn, setCamOn]         = useState(true)
  const [screenOn, setScreenOn]   = useState(false)
  const [peerConnected, setPeerConnected] = useState(false)
  const [peerCamOn, setPeerCamOn] = useState(true)
  const [peerMicOn, setPeerMicOn] = useState(true)
  const [facingMode, setFacingMode] = useState('user') // 'user' or 'environment'
  const [swappedView, setSwappedView] = useState(false)
  const [isPeerSharing, setIsPeerSharing] = useState(false)

  // UI / Side Panel / Modals
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('docs')
  const [moreOpen, setMoreOpen]   = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)
  const [copiedLink, setCopiedLink] = useState(false)
  const [docRefreshKey, setDocRefreshKey] = useState(0)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [showEndCallModal, setShowEndCallModal] = useState(false)

  // Notifications
  const [notifs, setNotifs] = useState([])
  const notifCounter = useRef(0)

  const timer = useTimer(!!sessionInfo && !sessionEnded)

  // Refs
  const localVideoRef       = useRef(null)
  const remoteVideoRef      = useRef(null)
  const localStream         = useRef(null)
  const screenStream        = useRef(null)
  const peerConn            = useRef(null)
  const stompClient         = useRef(null)
  const isOfferSide         = useRef(false)
  const pendingCandidates   = useRef([])

  function pushNotif(icon, title, msg) {
    const id = ++notifCounter.current
    setNotifs(prev => [...prev, { id, icon, title, msg, exiting: false }])
    setTimeout(() => dismissNotif(id), 5000)
    safeShowNotification(title, { body: msg, icon: '/favicon.ico' })
  }

  function dismissNotif(id) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, exiting: true } : n))
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 300)
  }

  // Keep local stream active on localVideoRef
  useEffect(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current
    }
  }, [camOn])

  // Handle window tab close by Doctor
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendSignal({ type: 'end', from: username })
      if (roomId) apiEndSession(roomId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username])

  // Request browser notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop())
      screenStream.current?.getTracks().forEach(t => t.stop())
      peerConn.current?.close()
      stompClient.current?.deactivate()
    }
  }, [])

  // STEP 1: Fast Parallel Initialization
  useEffect(() => {
    if (!username) { navigate('/'); return }
    let isCancelled = false

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        })
        if (isCancelled) return
        localStream.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch (err) {
        console.warn('Full media request failed, attempting audio-only fallback:', err)
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          })
          if (isCancelled) return
          localStream.current = audioStream
          setCamOn(false)
          if (localVideoRef.current) localVideoRef.current.srcObject = audioStream
        } catch (audioErr) {
          console.warn('Audio fallback also denied or failed:', audioErr)
        }
      }
    }

    initMedia()

    apiCheckRoom(roomId)
      .then(info => {
        if (isCancelled) return
        setSessionInfo(info)
        isOfferSide.current = (info.role === 'DOCTOR')
      })
      .catch(err => {
        if (!isCancelled) setInitError(err.message || 'Could not join session.')
      })

    return () => { isCancelled = true }
  }, [roomId, username, navigate])

  // STEP 2: Setup WebRTC and STOMP
  useEffect(() => {
    if (!sessionInfo) return

    async function startCall() {
      if (!localStream.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          })
          localStream.current = stream
          if (localVideoRef.current) localVideoRef.current.srcObject = stream
        } catch {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            localStream.current = audioStream
            setCamOn(false)
          } catch { /* proceed */ }
        }
      }

      setupWebRTC(localStream.current)
      setupStomp()
    }

    startCall()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionInfo])

  function setupWebRTC(stream) {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConn.current = pc

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
    }

    pc.ontrack = event => {
      if (remoteVideoRef.current) {
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        } else {
          if (!remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = new MediaStream()
          }
          remoteVideoRef.current.srcObject.addTrack(event.track)
        }
        remoteVideoRef.current.muted = false
        remoteVideoRef.current.volume = 1.0
        remoteVideoRef.current.play().catch(() => {})
        setPeerConnected(true)
        setParticipantCount(2)
      }
    }
    pc.onicecandidate = event => {
      if (event.candidate) {
        sendSignal({ type: 'candidate', candidate: event.candidate, from: username })
      }
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setPeerConnected(true)
        setParticipantCount(2)
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeerConnected(false)
        setParticipantCount(1)
        if (isOfferSide.current === false) {
          pushNotif('⚠️', 'Doctor disconnected', 'The doctor has left the meeting.')
          setTimeout(() => setSessionEnded(true), 1500)
        }
      }
    }
  }

  function setupStomp() {
    const token = getToken()
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl('/ws')),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 2000,
      onConnect: () => {
        client.subscribe(`/topic/room/${roomId}`, frame => {
          try {
            const msg = JSON.parse(frame.body)
            handleSignal(msg)
          } catch { /* ignore */ }
        })

        client.subscribe(`/topic/notify/${roomId}`, frame => {
          try {
            const msg = JSON.parse(frame.body)
            handleRoomNotification(msg)
          } catch { /* ignore */ }
        })

        if (isOfferSide.current) {
          sendNotification({ type: 'doctor_joined', from: username, name: username })
          createAndSendOffer()
        } else {
          sendNotification({ type: 'patient_joined', from: username, name: username })
        }
      },
      onStompError: () => {},
    })
    client.activate()
    stompClient.current = client
  }

  function sendSignal(msg) {
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/signal/${roomId}`,
        body: JSON.stringify(msg),
      })
    }
  }

  function sendNotification(msg) {
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/notify/${roomId}`,
        body: JSON.stringify(msg),
      })
    }
  }

  function handleRoomNotification(msg) {
    if (msg.from === username) return
    if (msg.type === 'doctor_joined') {
      pushNotif('👨‍⚕️', 'Doctor joined', `Dr. ${msg.name} is in the meeting.`)
      if (!isOfferSide.current) {
        sendNotification({ type: 'patient_joined', from: username, name: username })
      }
    } else if (msg.type === 'patient_joined') {
      pushNotif('🧑‍🤝‍🧑', 'Patient joined', `${msg.name} joined the meeting.`)
      if (isOfferSide.current) {
        createAndSendOffer()
      }
    } else if (msg.type === 'hand_raised') {
      pushNotif('✋', 'Hand raised', `${msg.name} raised their hand.`)
    } else if (msg.type === 'screen_share_started') {
      setIsPeerSharing(true)
      setPeerCamOn(true)
      pushNotif('🖥️', 'Screen sharing', `${msg.name} started presenting.`)
    } else if (msg.type === 'screen_share_stopped') {
      setIsPeerSharing(false)
      pushNotif('🖥️', 'Presentation stopped', `${msg.name} stopped presenting.`)
    } else if (msg.type === 'cam_off') {
      setPeerCamOn(false)
    } else if (msg.type === 'cam_on') {
      setPeerCamOn(true)
    } else if (msg.type === 'mic_off') {
      setPeerMicOn(false)
    } else if (msg.type === 'mic_on') {
      setPeerMicOn(true)
    } else if (msg.type === 'doc_updated') {
      setDocRefreshKey(k => k + 1)
      pushNotif('📁', 'Medical documents updated', `${msg.name} updated medical documents.`)
    } else if (msg.type === 'prescription_issued') {
      pushNotif('💊', 'Prescription Issued', `Dr. ${msg.name} has issued a prescription for you! Check your My Prescriptions page.`)
    }
  }

  async function handleSignal(msg) {
    if (msg.from === username) return
    const pc = peerConn.current
    if (!pc) return
    try {
      if (msg.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(msg))
        while (pendingCandidates.current.length > 0) {
          const cand = pendingCandidates.current.shift()
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
        }
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal({ type: 'answer', sdp: answer.sdp, from: username })
      } else if (msg.type === 'answer') {
        if (pc.signalingState !== 'have-local-offer') return
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.sdp }))
        while (pendingCandidates.current.length > 0) {
          const cand = pendingCandidates.current.shift()
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
        }
      } else if (msg.type === 'candidate') {
        if (msg.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {})
          } else {
            pendingCandidates.current.push(msg.candidate)
          }
        }
      } else if (msg.type === 'end') {
        handleRemoteEnd()
      }
    } catch { /* ignore */ }
  }

  async function flipCamera() {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user'
    try {
      const oldTrack = localStream.current?.getVideoTracks()[0]
      let newStream
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextFacing } },
          audio: false
        })
      } catch {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
          audio: false
        })
      }

      const newTrack = newStream.getVideoTracks()[0]
      if (!newTrack) throw new Error('No track on alternate camera')

      if (oldTrack) oldTrack.stop()

      if (peerConn.current) {
        const sender = peerConn.current.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) {
          await sender.replaceTrack(newTrack)
        }
      }

      if (localStream.current) {
        if (oldTrack) localStream.current.removeTrack(oldTrack)
        localStream.current.addTrack(newTrack)
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current
      }

      setFacingMode(nextFacing)
      setCamOn(true)
      pushNotif('📷', 'Camera Flipped', `Switched to ${nextFacing === 'user' ? 'front' : 'back'} camera.`)
    } catch (err) {
      console.warn('flipCamera error:', err)
      pushNotif('⚠️', 'Camera Flip', 'Back camera not accessible on this device.')
    }
  }

  async function createAndSendOffer() {
    const pc = peerConn.current
    if (!pc) return
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignal({ type: 'offer', sdp: offer.sdp, from: username })
    } catch { /* ignore */ }
  }

  function toggleMic() {
    const stream = localStream.current
    if (!stream) return
    const enabled = !micOn
    stream.getAudioTracks().forEach(t => { t.enabled = enabled })
    setMicOn(enabled)
    sendNotification({ type: enabled ? 'mic_on' : 'mic_off', from: username, name: username })
  }

  function toggleCam() {
    const stream = localStream.current
    if (!stream) return
    const enabled = !camOn
    stream.getVideoTracks().forEach(t => { t.enabled = enabled })
    setCamOn(enabled)
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current
    }
    sendNotification({ type: enabled ? 'cam_on' : 'cam_off', from: username, name: username })
  }

  async function toggleScreenShare() {
    if (screenOn) {
      screenStream.current?.getTracks().forEach(t => t.stop())
      screenStream.current = null
      const pc = peerConn.current
      if (pc && localStream.current) {
        const videoTrack = localStream.current.getVideoTracks()[0]
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender && videoTrack) await sender.replaceTrack(videoTrack).catch(() => {})
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current
      setScreenOn(false)
      sendNotification({ type: 'screen_share_stopped', from: username, name: username })
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        screenStream.current = displayStream
        const pc = peerConn.current
        if (pc) {
          const screenTrack = displayStream.getVideoTracks()[0]
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) await sender.replaceTrack(screenTrack).catch(() => {})
          screenTrack.onended = () => toggleScreenShare()
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = displayStream
        setScreenOn(true)
        sendNotification({ type: 'screen_share_started', from: username, name: username })
        pushNotif('🖥️', 'Presenting screen', 'You are currently presenting to everyone.')
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          pushNotif('⚠️', 'Presentation failed', err.message || 'Could not share screen.')
        }
      }
    }
  }

  function toggleHandRaise() {
    const raised = !handRaised
    setHandRaised(raised)
    if (raised) sendNotification({ type: 'hand_raised', from: username, name: username })
  }

  function notifyDocChange() {
    sendNotification({ type: 'doc_updated', from: username, name: username })
  }

  function handlePrescriptionIssued() {
    sendNotification({ type: 'prescription_issued', from: username, name: username })
    pushNotif('✅', 'Prescription Saved', 'Prescription has been issued and sent to the patient.')
  }

  function copyMeetingLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  async function confirmEndSession() {
    setShowEndCallModal(false)
    sendSignal({ type: 'end', from: username })
    try { await apiEndSession(roomId) } catch { /* best effort */ }
    cleanupAndMarkEnded()
  }

  function handleRemoteEnd() { cleanupAndMarkEnded() }

  function cleanupAndMarkEnded() {
    localStream.current?.getTracks().forEach(t => t.stop())
    screenStream.current?.getTracks().forEach(t => t.stop())
    peerConn.current?.close()
    stompClient.current?.deactivate()
    setSessionEnded(true)
  }

  function goBack() {
    navigate(role === 'DOCTOR' ? '/doctor' : '/patient', { replace: true })
  }

  // Render: Init error
  if (initError) {
    return (
      <div className="vroom-root meet-theme" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e8eaed' }}>Cannot join consultation</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>{initError}</p>
        <button className="meet-btn-primary" onClick={goBack}>← Back to Dashboard</button>
      </div>
    )
  }

  // Render: Session ended
  if (sessionEnded) {
    return (
      <div className="vroom-ended meet-theme">
        <div className="vroom-ended-icon">👋</div>
        <h2>Session Ended</h2>
        <p>The consultation session has ended. Thank you for using Medicare Video.</p>
        <button className="meet-btn-primary" onClick={goBack}>Return to Dashboard</button>
      </div>
    )
  }

  // Main Render: Google Meet Layout
  return (
    <div className="vroom-root meet-theme">
      {/* End Call Project Confirm Modal */}
      <ConfirmModal
        isOpen={showEndCallModal}
        title="End Consultation Session"
        icon="⚠️"
        message="Are you sure you want to end this consultation session for all participants?"
        confirmText="End Session"
        confirmVariant="danger"
        onConfirm={confirmEndSession}
        onCancel={() => setShowEndCallModal(false)}
      />

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <PrescriptionModal
          appointmentId={sessionInfo?.appointmentId}
          patientName={sessionInfo?.patientName}
          onClose={() => setShowPrescriptionModal(false)}
          onPrescriptionIssued={handlePrescriptionIssued}
        />
      )}

      {/* Toast notifications */}
      <NotifToast notifs={notifs} onDismiss={dismissNotif} />

      {/* Google Meet Top Header */}
      <div className="meet-topbar">
        <div className="meet-topbar-left">
          <div className="meet-brand-logo">
            <span className="meet-dot-green" />
            <span className="meet-title">
              {sessionInfo
                ? `Dr. ${sessionInfo.doctorName} • ${sessionInfo.patientName}`
                : 'Medical Consultation Call'}
            </span>
          </div>
          {screenOn && (
            <div className="meet-presenting-chip">
              <Monitor size={13} /> You are presenting
            </div>
          )}
        </div>

        <div className="meet-topbar-right">
          <div className="meet-time-clock">{timer}</div>

          {/* Doctor Prescription Quick Button in Header */}
          {role === 'DOCTOR' && (
            <button
              className="meet-tab-btn active"
              onClick={() => setShowPrescriptionModal(true)}
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <ClipboardPlus size={15} /> Issue Prescription
            </button>
          )}

          <button
            className={`meet-header-icon-btn ${panelOpen && activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => { setPanelOpen(o => !o || activeTab !== 'docs'); setActiveTab('docs') }}
            title="Medical Documents"
          >
            <FileText size={18} />
          </button>

          <button
            className={`meet-header-icon-btn ${panelOpen && activeTab === 'people' ? 'active' : ''}`}
            onClick={() => { setPanelOpen(o => !o || activeTab !== 'people'); setActiveTab('people') }}
            title="People in call"
          >
            <Users size={18} />
            <span className="meet-badge">{participantCount}</span>
          </button>
        </div>
      </div>

      {/* Google Meet Stage & Body */}
      <div className="meet-body">
        <div className={`meet-stage ${panelOpen ? 'with-panel' : ''}`}>

          {/* Google Meet Stage View with Picture-in-Picture */}
          <div className="meet-stage-container">

            {/* Main Stage Tile */}
            <div className={`meet-tile meet-main-tile ${isPeerSharing || screenOn ? 'presenting' : ''}`}>
              {peerConnected ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: isPeerSharing ? 'contain' : 'cover',
                      display: peerCamOn ? 'block' : 'none'
                    }}
                  />
                  {!peerCamOn && (
                    <div className="meet-avatar-placeholder">
                      <div className="avatar-circle">
                        {role === 'DOCTOR' ? '🧑‍🤝‍🧑' : '👨‍⚕️'}
                      </div>
                      <span className="avatar-name">
                        {role === 'DOCTOR' ? sessionInfo?.patientName : `Dr. ${sessionInfo?.doctorName}`}
                      </span>
                    </div>
                  )}
                  <div className="meet-tile-name">
                    {!peerMicOn && <MicOff size={13} className="mic-off-icon" />}
                    <span>{role === 'DOCTOR' ? sessionInfo?.patientName : `Dr. ${sessionInfo?.doctorName}`}</span>
                    {isPeerSharing && <span className="meet-presenting-tag" style={{ marginLeft: 8, background: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem' }}>🖥️ Presenting</span>}
                  </div>
                </>
              ) : (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: camOn ? 'block' : 'none' }}
                  />
                  {!camOn && (
                    <div className="meet-avatar-placeholder">
                      <div className="avatar-circle">
                        {role === 'DOCTOR' ? '👨‍⚕️' : '🧑‍🤝‍🧑'}
                      </div>
                      <span className="avatar-name">You</span>
                    </div>
                  )}
                  <div className="meet-tile-name">
                    {!micOn && <MicOff size={13} className="mic-off-icon" />}
                    <span>You {handRaised ? '✋' : ''}</span>
                  </div>
                  <div style={{ position: 'absolute', top: 20, background: 'rgba(32,33,36,0.85)', backdropFilter: 'blur(6px)', padding: '8px 16px', borderRadius: 20, color: '#e8eaed', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="meet-dot-green" />
                    <span>Waiting for {role === 'DOCTOR' ? (sessionInfo?.patientName || 'patient') : (`Dr. ${sessionInfo?.doctorName || 'doctor'}`)} to join…</span>
                  </div>
                </>
              )}
            </div>

            {/* Floating Picture-in-Picture Tile (Self-View in Bottom-Right Corner) */}
            {peerConnected && (
              <div className="meet-pip-tile" title="Your camera view">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: camOn ? 'block' : 'none' }}
                />
                {!camOn && (
                  <div className="meet-avatar-placeholder" style={{ transform: 'scale(0.65)' }}>
                    <div className="avatar-circle" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                      {role === 'DOCTOR' ? '👨‍⚕️' : '🧑‍🤝‍🧑'}
                    </div>
                  </div>
                )}
                <div className="meet-tile-name" style={{ fontSize: '0.7rem', padding: '2px 8px', bottom: 6, left: 6 }}>
                  {!micOn && <MicOff size={11} className="mic-off-icon" />}
                  <span>You {handRaised ? '✋' : ''}</span>
                </div>
              </div>
            )}

          </div>

          {/* Google Meet Floating Control Capsule Bar */}
          <div className="meet-controls-wrapper">
            <div className="meet-controls-bar">

              <button
                className={`meet-ctrl-btn ${!micOn ? 'off' : ''}`}
                onClick={toggleMic}
                title={micOn ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                className={`meet-ctrl-btn ${!camOn ? 'off' : ''}`}
                onClick={toggleCam}
                title={camOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                className="meet-ctrl-btn"
                onClick={flipCamera}
                title={`Switch camera (Currently ${facingMode === 'user' ? 'Front' : 'Back'})`}
              >
                <RefreshCw size={20} />
              </button>

              {/* Doctor Prescription Action Button in Capsule */}
              {role === 'DOCTOR' && (
                <button
                  className="meet-ctrl-btn"
                  onClick={() => setShowPrescriptionModal(true)}
                  title="Issue Prescription"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}
                >
                  <ClipboardPlus size={20} />
                </button>
              )}

              <button
                className={`meet-ctrl-btn ${screenOn ? 'active-blue' : ''}`}
                onClick={toggleScreenShare}
                title={screenOn ? 'Stop presenting' : 'Present now'}
              >
                {screenOn ? <MonitorOff size={20} /> : <Monitor size={20} />}
              </button>

              <button
                className={`meet-ctrl-btn ${handRaised ? 'active-yellow' : ''}`}
                onClick={toggleHandRaise}
                title={handRaised ? 'Lower hand' : 'Raise hand'}
              >
                <Hand size={20} />
              </button>

              <button
                className={`meet-ctrl-btn ${panelOpen && activeTab === 'docs' ? 'active-blue' : ''}`}
                onClick={() => { setPanelOpen(o => !o || activeTab !== 'docs'); setActiveTab('docs') }}
                title="Medical Documents"
              >
                <FileText size={20} />
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  className={`meet-ctrl-btn ${moreOpen ? 'active-gray' : ''}`}
                  onClick={() => setMoreOpen(o => !o)}
                  title="More options"
                >
                  <MoreVertical size={20} />
                </button>
                {moreOpen && (
                  <div className="meet-more-menu" onClick={() => setMoreOpen(false)}>
                    {role === 'DOCTOR' && (
                      <button className="meet-menu-item" onClick={() => setShowPrescriptionModal(true)}>
                        <ClipboardPlus size={16} /> Issue Prescription
                      </button>
                    )}
                    <button className="meet-menu-item" onClick={copyMeetingLink}>
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                      {copiedLink ? 'Link Copied!' : 'Copy meeting link'}
                    </button>
                    <button className="meet-menu-item" onClick={() => pushNotif('⚙️', 'Settings', 'Default audio and camera selected.')}>
                      <Settings size={16} /> Device Settings
                    </button>
                  </div>
                )}
              </div>

              <button
                className="meet-hangup-btn"
                onClick={() => setShowEndCallModal(true)}
                title="Leave call"
              >
                <PhoneOff size={22} />
              </button>

            </div>
          </div>
        </div>

        {panelOpen && (
          <MeetSidePanel
            roomId={roomId}
            role={role}
            appointmentId={sessionInfo?.appointmentId}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setPanelOpen(false)}
            sessionInfo={sessionInfo}
            notifyDocChange={notifyDocChange}
            reloadKey={docRefreshKey}
          />
        )}
      </div>
    </div>
  )
}
