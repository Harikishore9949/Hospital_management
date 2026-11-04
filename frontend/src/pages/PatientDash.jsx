import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
  Search, ClipboardList, RefreshCw, Users, Video,
  FileText, Upload, Trash2, Eye, X, BookOpen, Briefcase, Award, Star, ArrowLeft,
  Stethoscope, MapPin, GraduationCap, Calendar, Pill, Bell, CheckCircle2, Clock,
  Siren, Heart, Newspaper, Filter, ShoppingBag, CreditCard,
  Activity, FlaskConical, Building2, Printer, CalendarClock
} from 'lucide-react'
import DashLayout from '../components/DashLayout'
import PrintPrescriptionModal from '../components/PrintPrescriptionModal'
import AppointmentPaymentModal from '../components/AppointmentPaymentModal'
import { CancelAppointmentModal, RescheduleAppointmentModal } from '../components/AppointmentActionModals'
import VitalsAndEHRSection from '../components/VitalsAndEHRSection'
import DiagnosticsLabSection from '../components/DiagnosticsLabSection'
import HospitalFacilitiesSection from '../components/HospitalFacilitiesSection'
import {
  getUsername, getToken,
  apiGetAllDoctors, apiGetDoctorSlots, apiGetDoctorProfile,
  apiBookAppointment, apiGetMyAppointments,
  apiGetSessionStatus, apiGetMyDocuments,
  apiUploadDocument, apiDeleteDocument, apiDocFileUrl,
  apiGetMyPrescriptions, apiDeletePrescription, apiMarkMedicineTaken, apiGetMedicineLogs,
  apiCreateReminder, apiGetReminders, apiDeleteReminder, apiGetAdherence,
  apiCheckPrescriptionAvailability, apiPlaceMedicineOrder, apiGetMyMedicineOrders,
  apiRaiseEmergency, apiCancelEmergency, apiGetMyEmergencies,
  apiGetArticles, apiLikeArticle, apiChangePassword,
  apiGetPatientProfile, apiSavePatientProfile, apiLikeDoctor,
  fmtDate, fmtTime, fmtDateTime,
} from '../api'
import '../components/ui.css'
import '../components/dashboard.css'

function Alert({ type, msg, onClose }) {
  if (!msg) return null
  const icon = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type]
  return (
    <div className={`alert alert-${type}`} style={{ marginBottom: 18, cursor: 'pointer' }} onClick={onClose}>
      <span>{icon}</span><span>{msg}</span>
    </div>
  )
}

/* ── Doctor Detail Panel (profile + slots + booking) ── */
function DoctorDetailPanel({ doctorProfile, onBack }) {
  // doctorProfile is the full DoctorProfile object (with .user embedded)
  const doctor = doctorProfile.user
  const [profile, setProfile]         = useState(doctorProfile)
  const [slots, setSlots]             = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [bookLoading, setBookLoading]   = useState(false)
  const [slotAlert, setSlotAlert]       = useState(null)
  const [bookAlert, setBookAlert]       = useState(null)

  const [bookForm, setBookForm] = useState({
    patientFullName: '', patientAge: '', patientPhone: '', patientSex: '', healthIssue: '', countryCode: '+91',
  })
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [phoneExceeded, setPhoneExceeded] = useState(false)

  useEffect(() => {
    if (!doctor) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    setSlotAlert(null)
    setBookAlert(null)
    setBookForm({ patientFullName: '', patientAge: '', patientPhone: '', patientSex: '', healthIssue: '' })

    // Also refresh profile from the server (in case it changed)
    apiGetDoctorProfile(doctor.id)
      .then(data => setProfile(data))
      .catch(() => {/* keep the initial profile */})

    apiGetDoctorSlots(doctor.id)
      .then(data => {
        const available = (data || []).filter(s => s.available !== false)
        setSlots(available)
        if (available.length === 0) setSlotAlert({ type: 'info', msg: 'No available slots at the moment.' })
      })
      .catch(err => setSlotAlert({ type: 'error', msg: err.message || 'Failed to load slots.' }))
      .finally(() => setSlotsLoading(false))
  }, [doctor])

  async function handleBook(e) {
    e.preventDefault()
    if (!selectedSlot) return
    setBookAlert(null)
    if (!bookForm.patientFullName.trim()) { setBookAlert({ type: 'warning', msg: 'Please enter your full name.' }); return }
    if (!bookForm.patientAge || bookForm.patientAge < 1) { setBookAlert({ type: 'warning', msg: 'Please enter a valid age.' }); return }
    if (!bookForm.patientPhone.trim()) { setBookAlert({ type: 'warning', msg: 'Please enter your phone number.' }); return }
    if (!/^\d{10}$/.test(bookForm.patientPhone.trim())) { setBookAlert({ type: 'warning', msg: 'Phone number must be exactly 10 digits.' }); return }
    if (!bookForm.patientSex) { setBookAlert({ type: 'warning', msg: 'Please select your sex.' }); return }
    if (!bookForm.healthIssue.trim()) { setBookAlert({ type: 'warning', msg: 'Please describe your health issue.' }); return }

    setBookLoading(true)
    try {
      await apiBookAppointment({
        availabilitySlotId: selectedSlot.id,
        patientFullName: bookForm.patientFullName.trim(),
        patientAge: parseInt(bookForm.patientAge),
        patientPhone: bookForm.countryCode + bookForm.patientPhone.trim(),
        patientSex: bookForm.patientSex,
        healthIssue: bookForm.healthIssue.trim(),
      })
      setBookAlert({ type: 'success', msg: `✅ Appointment request sent! Awaiting Dr. ${doctor.username}'s confirmation.` })
      setSlots(prev => prev.map(s => s.id === selectedSlot.id ? { ...s, _booked: true } : s))
      setSelectedSlot(null)
      setBookForm({ patientFullName: '', patientAge: '', patientPhone: '', patientSex: '', healthIssue: '', countryCode: '+91' })
    } catch (err) {
      setBookAlert({ type: 'error', msg: err.message || 'Booking failed. Please try again.' })
    } finally { setBookLoading(false) }
  }

  const displayName = profile?.fullName || `Dr. ${doctor?.username}`
  const hasProfileData = profile && (profile.specialization || profile.department || profile.educationBackground || profile.experienceSummary)

  return (
    <div className="view-section" style={{ animation: 'fadeInUp 0.25s ease' }}>
      {/* Back header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: 'auto', gap: 6 }}
          onClick={onBack}
        >
          <ArrowLeft size={14} /> Back to Doctors
        </button>
        <span style={{ color: 'var(--clr-neutral-400)', fontSize: '0.85rem' }}>Doctor Profile</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 22, alignItems: 'start' }}>

        {/* ── Left: Doctor Profile ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Hero card */}
          <div className="card" style={{ background: 'linear-gradient(145deg,#1e3a5f 0%,#1e2235 100%)', border: 'none', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'rgba(59,130,246,0.12)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, background: 'rgba(20,184,166,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(20,184,166,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                {profile?.photoBase64
                  ? <img src={profile.photoBase64} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '\ud83d\udc68\u200d\u2695\ufe0f'
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff', marginBottom: 4 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                  @{doctor?.username}
                  {profile?.age && <span style={{ marginLeft: 12 }}>· Age {profile.age}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile?.specialization && (
                    <span style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.45)', color: '#93c5fd', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Stethoscope size={11} /> {profile.specialization}
                    </span>
                  )}
                  {profile?.department && (
                    <span style={{ background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.35)', color: '#5eead4', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={11} /> {profile.department}
                    </span>
                  )}
                  {profile?.degrees && profile.degrees.split('\n').filter(Boolean).slice(0, 3).map((d, i) => (
                    <span key={i} style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)', color: '#d8b4fe', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GraduationCap size={11} /> {d.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!hasProfileData && (
            <div className="card">
              <div className="card-body">
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">Profile not filled yet</div>
                  <div className="empty-text">The doctor hasn't completed their profile yet. You can still book a slot on the right.</div>
                </div>
              </div>
            </div>
          )}

          {/* Education */}
          {profile?.educationBackground && (
            <div className="card">
              <div className="card-header"><div className="card-title"><BookOpen size={15} /> Education Background</div></div>
              <div className="card-body">
                <div style={{ fontSize: '0.9rem', color: 'var(--clr-neutral-800)', whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                  {profile.educationBackground}
                </div>
              </div>
            </div>
          )}

          {/* Degrees */}
          {profile?.degrees && (
            <div className="card">
              <div className="card-header"><div className="card-title"><GraduationCap size={15} /> Degrees &amp; Certifications</div></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.degrees.split('\n').filter(Boolean).map((d, i) => (
                    <span key={i} style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary-700)', border: '1px solid var(--clr-primary-200)', borderRadius: 8, padding: '5px 14px', fontSize: '0.82rem', fontWeight: 700 }}>
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Experience */}
          {profile?.experienceSummary && (
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
          {(profile?.memberships || profile?.awards) && (
            <div className="card">
              <div className="card-header"><div className="card-title"><Award size={15} /> Memberships &amp; Awards</div></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: profile?.memberships && profile?.awards ? '1fr 1fr' : '1fr', gap: 24 }}>
                  {profile?.memberships && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-neutral-500)', marginBottom: 10 }}>Memberships</div>
                      {profile.memberships.split('\n').filter(Boolean).map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.88rem' }}>
                          <span style={{ marginTop: 2 }}>🎖️</span>
                          <span>{m.trim()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {profile?.awards && (
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
          {profile?.additionalNotes && (
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

        {/* ── Right: Available Slots + Booking ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <div className="card-header">
              <div className="card-title"><Calendar size={15} /> Available Slots</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--clr-neutral-400)' }}>Click to select</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <Alert {...(slotAlert || {})} msg={slotAlert?.msg} onClose={() => setSlotAlert(null)} />
              {slotsLoading
                ? <div className="page-spinner"><span className="spinner" /> Loading slots…</div>
                : slots.length === 0
                  ? <div className="empty-state" style={{ padding: '20px 0' }}>
                      <div className="empty-icon" style={{ fontSize: '2rem' }}>📅</div>
                      <div className="empty-title" style={{ fontSize: '0.9rem' }}>No available slots</div>
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {slots.map(slot => {
                        const isSelected = selectedSlot?.id === slot.id
                        return (
                          <div
                            key={slot.id}
                            onClick={() => !slot._booked && setSelectedSlot(isSelected ? null : slot)}
                            style={{
                              border: isSelected ? '2px solid var(--clr-primary-500)' : '1.5px solid var(--clr-neutral-200)',
                              background: slot._booked ? 'var(--clr-neutral-50)' : isSelected ? 'var(--clr-primary-50)' : '#fff',
                              borderRadius: 10,
                              padding: '12px 14px',
                              cursor: slot._booked ? 'default' : 'pointer',
                              opacity: slot._booked ? 0.5 : 1,
                              transition: 'all 0.18s',
                              boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--clr-neutral-800)' }}>📅 {fmtDate(slot.date)}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--clr-neutral-500)', marginTop: 2 }}>🕐 {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</div>
                            <div style={{ marginTop: 6 }}>
                              {slot._booked
                                ? <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>🔴 Booked</span>
                                : isSelected
                                  ? <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>✔ Selected</span>
                                  : <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>🟢 Available</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
              }
            </div>
          </div>

          {/* Booking form */}
          {selectedSlot && !selectedSlot._booked && (
            <div className="card animate-fade-up" style={{ border: '2px solid var(--clr-primary-400)', background: '#ffffff', boxShadow: '0 4px 20px rgba(59,130,246,0.12)' }}>
              <div className="card-header" style={{ borderBottom: '1.5px solid var(--clr-neutral-100)', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '12px 12px 0 0' }}>
                <div className="card-title" style={{ color: 'var(--clr-primary-700)', fontSize: '0.92rem', fontWeight: 700 }}>📋 Your Details</div>
                <button className="btn btn-ghost" style={{ width: 'auto', padding: '4px', minWidth: 0 }} onClick={() => { setSelectedSlot(null); setBookAlert(null) }}>
                  <X size={14} />
                </button>
              </div>
              <div className="card-body" style={{ background: '#ffffff' }}>
                <Alert {...(bookAlert || {})} msg={bookAlert?.msg} onClose={() => setBookAlert(null)} />
                <form onSubmit={handleBook}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--clr-neutral-800)', fontWeight: 700 }}>Full Name <span style={{ color: '#f43f5e' }}>*</span></label>
                      <input className="form-input" type="text" placeholder="Your full name"
                        style={{ background: '#fff', color: 'var(--clr-neutral-900)', border: '1.5px solid var(--clr-neutral-300)' }}
                        value={bookForm.patientFullName}
                        onChange={e => setBookForm(f => ({ ...f, patientFullName: e.target.value }))} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--clr-neutral-800)', fontWeight: 700 }}>Age <span style={{ color: '#f43f5e' }}>*</span></label>
                        <input className="form-input" type="number" min="1" max="150" placeholder="Age"
                          style={{ background: '#fff', color: 'var(--clr-neutral-900)', border: '1.5px solid var(--clr-neutral-300)' }}
                          value={bookForm.patientAge}
                          onChange={e => setBookForm(f => ({ ...f, patientAge: e.target.value }))} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--clr-neutral-800)', fontWeight: 700 }}>Sex <span style={{ color: '#f43f5e' }}>*</span></label>
                        <select className="form-input"
                          style={{ background: '#fff', color: 'var(--clr-neutral-900)', border: '1.5px solid var(--clr-neutral-300)' }}
                          value={bookForm.patientSex}
                          onChange={e => setBookForm(f => ({ ...f, patientSex: e.target.value }))} required>
                          <option value="">Select…</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--clr-neutral-800)', fontWeight: 700 }}>Phone <span style={{ color: '#f43f5e' }}>*</span></label>
                      <div style={{
                        display: 'flex', gap: 6,
                        borderRadius: 10,
                        outline: phoneFocused ? '2px solid #2563eb' : '2px solid transparent',
                        transition: 'outline 0.15s',
                      }}>
                        <select
                          className="form-input"
                          style={{ width: 110, flexShrink: 0, background: '#fff', color: 'var(--clr-neutral-900)', border: '1.5px solid var(--clr-neutral-300)', borderRadius: 8, fontWeight: 600 }}
                          value={bookForm.countryCode}
                          onChange={e => setBookForm(f => ({ ...f, countryCode: e.target.value }))}
                          onFocus={() => setPhoneFocused(true)}
                          onBlur={() => setPhoneFocused(false)}
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+65">🇸🇬 +65</option>
                        </select>
                        <input
                          className="form-input"
                          type="tel"
                          placeholder="10-digit number"
                          style={{
                            background: '#fff', color: 'var(--clr-neutral-900)',
                            border: `1.5px solid ${phoneExceeded ? '#ef4444' : 'var(--clr-neutral-300)'}`,
                            borderRadius: 8, flex: 1,
                          }}
                          value={bookForm.patientPhone}
                          onFocus={() => setPhoneFocused(true)}
                          onBlur={() => { setPhoneFocused(false); setPhoneExceeded(false) }}
                          onChange={e => {
                            const digits = e.target.value.replace(/\D/g, '')
                            if (digits.length > 10) {
                              setPhoneExceeded(true)
                              return  // block — don't update
                            }
                            setPhoneExceeded(false)
                            setBookForm(f => ({ ...f, patientPhone: digits }))
                          }}
                          required
                        />
                      </div>
                      {/* Only show counter once user has started typing */}
                      {bookForm.patientPhone.length > 0 && (
                        <div style={{ fontSize: '0.72rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: bookForm.patientPhone.length === 10 ? '#16a34a' : '#6b7280' }}>
                            {bookForm.patientPhone.length}/10 digits
                            {bookForm.patientPhone.length === 10 && ' ✓'}
                          </span>
                          {phoneExceeded && (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ Phone number cannot exceed 10 digits</span>
                          )}
                        </div>
                      )}
                      {phoneExceeded && bookForm.patientPhone.length === 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠️ Phone number cannot exceed 10 digits</div>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--clr-neutral-800)', fontWeight: 700 }}>Health Issue <span style={{ color: '#f43f5e' }}>*</span></label>
                      <textarea className="form-input" rows={3} placeholder="Describe your health concern…"
                        style={{ resize: 'vertical', background: '#fff', color: 'var(--clr-neutral-900)', border: '1.5px solid var(--clr-neutral-300)' }}
                        value={bookForm.healthIssue}
                        onChange={e => setBookForm(f => ({ ...f, healthIssue: e.target.value }))} required />
                    </div>
                    <button id="book-btn" type="submit" className="btn btn-primary" disabled={bookLoading}>
                      {bookLoading ? <><span className="btn-spinner" /> Submitting…</> : '📅 Book Appointment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Find Doctor / Doctor List section ── */
function FindSection() {
  const [doctorProfiles, setDoctorProfiles]   = useState([])
  const [doctorsLoading, setDoctorsLoading]   = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [doctorAlert, setDoctorAlert]         = useState(null)

  useEffect(() => {
    setDoctorsLoading(true)
    apiGetAllDoctors()
      .then(data => setDoctorProfiles(data || []))
      .catch(err => setDoctorAlert({ type: 'error', msg: err.message || 'Failed to load doctors.' }))
      .finally(() => setDoctorsLoading(false))
  }, [])

  if (selectedProfile) {
    return <DoctorDetailPanel doctorProfile={selectedProfile} onBack={() => setSelectedProfile(null)} />
  }

  return (
    <div className="view-section">
      {/* Welcome banner */}
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg,#1e2235 0%,#0891b2 60%,#0e7490 100%)' }}>
        <div className="welcome-text">
          <div className="welcome-greeting">Hello, Patient 👋</div>
          <div className="welcome-name">{getUsername()}</div>
          <div className="welcome-desc">Browse available doctors, view their profiles, and book your appointment.</div>
        </div>
        <div className="welcome-emoji">🧑‍🤝‍🧑</div>
      </div>

      {/* Doctor grid */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Users size={16} /> Available Doctors</div>
          <span style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-400)' }}>Click a doctor to view profile &amp; book</span>
        </div>
        <div className="card-body">
          <Alert {...(doctorAlert || {})} msg={doctorAlert?.msg} onClose={() => setDoctorAlert(null)} />
          {doctorsLoading
            ? <div className="page-spinner"><span className="spinner" /> Loading doctors…</div>
            : (() => {
                const activeDoctors = doctorProfiles.filter(dp => dp.user && dp.user.username !== 'doctor')
                if (activeDoctors.length === 0) {
                  return (
                    <div className="empty-state">
                      <div className="empty-icon">👨‍⚕️</div>
                      <div className="empty-title">No doctors registered yet</div>
                      <div className="empty-text">Please check back later or contact hospital administration.</div>
                    </div>
                  )
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                    {activeDoctors.map(dp => {
                      const doc = dp.user
                      if (!doc) return null
                      const displayName = dp.fullName || `Dr. ${doc.username}`
                      const specialization = dp.specialization || dp.department || 'Hospital Doctor'
                      const degreesList = dp.degrees ? dp.degrees.split('\n').filter(Boolean) : []
                      const degreesText = degreesList.length > 0 ? degreesList.join(', ') : ''
                      const expSummary = dp.experienceSummary ? dp.experienceSummary.split('.')[0] : ''
                      const subtitleText = [expSummary, degreesText].filter(Boolean).join(' • ')

                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedProfile(dp)}
                          style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1.5px solid #e2e8f0',
                            boxShadow: '0 4px 18px rgba(2,132,199,0.06)',
                            padding: '22px 20px',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-3px)'
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(2,132,199,0.12)'
                            e.currentTarget.style.borderColor = '#bae6fd'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 18px rgba(2,132,199,0.06)'
                            e.currentTarget.style.borderColor = '#e2e8f0'
                          }}
                        >
                          {/* Top Card Info Row: Photo on Left, Details on Right */}
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            {/* Doctor Avatar / Photo */}
                            <div style={{
                              width: 86, height: 92, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                              background: '#f8fafc', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {dp.photoBase64 ? (
                                <img src={dp.photoBase64} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ fontSize: '2.7rem' }}>👨‍⚕️</div>
                              )}
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>
                                {displayName}
                              </h3>

                              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#d97706', marginTop: 2 }}>
                                {specialization}
                              </div>

                              {subtitleText && (
                                <div style={{ fontSize: '0.86rem', color: '#475569', marginTop: 4, fontWeight: 500 }}>
                                  {subtitleText}
                                </div>
                              )}

                              {dp.department && dp.department !== specialization && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                  <span style={{
                                    fontSize: '0.76rem', color: '#0284c7', background: '#f0f9ff',
                                    border: '1px solid #bae6fd', borderRadius: 8, padding: '3px 8px', fontWeight: 600
                                  }}>
                                    🏥 {dp.department}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Authentic Likes & Consults Banner (Starts at 0, only real patient data) */}
                          <div style={{
                            background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10,
                            padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 700, fontSize: '0.88rem' }}>
                                <span>👍</span> {dp.likesCount || 0} Likes
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 700, fontSize: '0.88rem' }}>
                                <span>💬</span> {dp.consultsCount || 0} Consults
                              </div>
                            </div>

                            {/* Actual Patient Like Button */}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  const updated = await apiLikeDoctor(doc.id)
                                  if (updated) {
                                    setDoctorProfiles(prev => prev.map(p => (p.user?.id === doc.id ? { ...p, likesCount: updated.likesCount } : p)))
                                  }
                                } catch (err) {
                                  console.error('Failed to like doctor:', err)
                                }
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #86efac',
                                color: '#166534',
                                borderRadius: 8,
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s'
                              }}
                              title="Like this doctor"
                            >
                              <span>👍</span> Like
                            </button>
                          </div>

                          {/* Bottom Row: Verified Doctor Badge on Left, Select Slot Button on Right (NO PRICE OR DISCOUNT) */}
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0284c7', fontSize: '0.82rem', fontWeight: 700 }}>
                              <span>🩺</span> Verified Specialist
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProfile(dp);
                              }}
                              style={{
                                background: '#0d9488',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 24px',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(13,148,136,0.22)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#0f766e'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#0d9488'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              Select Slot
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
        </div>
      </div>
    </div>
  )
}

/* -- My Appointments section -------------- */
function MyApptsSection() {
  const navigate = useNavigate()
  const username = getUsername()
  const token = getToken()
  const [appts, setAppts]     = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert]     = useState(null)
  const [sessionMap, setSessionMap] = useState({})
  const [joiningId, setJoiningId]   = useState(null)
  const [activeSessionAlert, setActiveSessionAlert] = useState(null)
  const [payingAppt, setPayingAppt] = useState(null)
  const [cancellingAppt, setCancellingAppt] = useState(null)
  const [reschedulingAppt, setReschedulingAppt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setAlert(null)
    try {
      const data = await apiGetMyAppointments()
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
      const accepted = active.filter(a => a.status === 'ACCEPTED')
      const results = await Promise.allSettled(accepted.map(a => apiGetSessionStatus(a.id)))
      const map = {}
      let activeAlert = null
      accepted.forEach((a, i) => {
        if (results[i].status === 'fulfilled') {
          const res = results[i].value
          map[a.id] = res
          if (res?.active && res?.roomId && !activeAlert) {
            activeAlert = {
              doctorName: a.doctor?.username || 'your doctor',
              roomId: res.roomId,
              appointmentId: a.id,
            }
          }
        }
      })
      setSessionMap(map)
      if (activeAlert) setActiveSessionAlert(activeAlert)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Could not load your appointments.' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Poll active session status every 4 seconds for instant updates
  useEffect(() => {
    const interval = setInterval(() => {
      const accepted = appts.filter(a => a.status === 'ACCEPTED')
      if (accepted.length > 0) {
        Promise.allSettled(accepted.map(a => apiGetSessionStatus(a.id))).then(results => {
          const map = {}
          let activeAlert = null
          accepted.forEach((a, i) => {
            if (results[i].status === 'fulfilled') {
              const res = results[i].value
              map[a.id] = res
              if (res?.active && res?.roomId && !activeAlert) {
                activeAlert = {
                  doctorName: a.doctor?.username || 'your doctor',
                  roomId: res.roomId,
                  appointmentId: a.id,
                }
              }
            }
          })
          setSessionMap(map)
          if (activeAlert) setActiveSessionAlert(activeAlert)
        })
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [appts])

  // Connect STOMP for instant real-time notification
  useEffect(() => {
    if (!username || !token) return
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8100/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        const handler = (frame) => {
          try {
            const data = JSON.parse(frame.body)
            if (data.type === 'SESSION_STARTED' && data.roomId) {
              setActiveSessionAlert({
                doctorName: data.doctorName,
                roomId: data.roomId,
                appointmentId: data.appointmentId,
              })
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('👨‍⚕️ Session Started!', {
                  body: `Dr. ${data.doctorName} has started your consultation session and is waiting for you.`,
                  icon: '/favicon.ico',
                })
              }
            }
            if (data.type === 'PRESCRIPTION_ISSUED' || data.type === 'prescription_issued') {
              setAlert({ type: 'success', msg: `💊 New prescription received from Dr. ${data.doctorName || ''}!` })
              window.dispatchEvent(new CustomEvent('prescription_updated'))
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('💊 Prescription Received', {
                  body: `Dr. ${data.doctorName || 'Doctor'} issued a new prescription for you.`,
                  icon: '/favicon.ico',
                })
              }
            }
          } catch { /* ignore parse error */ }
        }
        client.subscribe(`/topic/patient-notifications/${username}`, handler)
        client.subscribe('/topic/patient-notifications', handler)
      },
    })
    client.activate()
    return () => { client.deactivate() }
  }, [username, token])

  const getPaymentDeadlineInfo = (deadline) => {
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

  const statusBadge = (status, paymentStatus, deadline) => {
    const isPaid = paymentStatus === 'PAID'
    const isRefunded = paymentStatus === 'REFUNDED'
    const deadlineInfo = getPaymentDeadlineInfo(deadline)

    if (status === 'PENDING') {
      return (
        <div>
          <span className="badge badge-warning">⏳ Awaiting Doctor Approval</span>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>Doctor can accept or reject</div>
        </div>
      )
    }

    if (status === 'ACCEPTED') {
      if (isPaid) {
        return <span className="badge badge-success">✅ Confirmed & Paid</span>
      }
      return (
        <div>
          <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1.5px solid #fde68a', fontWeight: 800 }}>
            ⚡ Approved — Payment Due
          </span>
          <div style={{ fontSize: '0.68rem', color: deadlineInfo?.expired ? '#ef4444' : '#b45309', marginTop: 3, fontWeight: 700 }}>
            {deadlineInfo ? (deadlineInfo.expired ? '❌ 6h window expired' : `⏱️ ${deadlineInfo.text}`) : 'Pay within 6 hours'}
          </div>
        </div>
      )
    }

    if (status === 'CANCELLED') {
      if (isRefunded) {
        return <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800 }}>💰 Cancelled & Refunded</span>
      }
      return <span className="badge">🚫 Cancelled</span>
    }

    if (status === 'REJECTED') {
      return <span className="badge badge-error">❌ Rejected</span>
    }

    if (status === 'COMPLETED') {
      return <span className="badge badge-primary">🏁 Completed</span>
    }

    return <span className="badge">{status}</span>
  }

  async function joinSession(apptId) {
    setJoiningId(apptId)
    try {
      const s = await apiGetSessionStatus(apptId)
      if (s.active && s.roomId) {
        navigate(`/session/${s.roomId}`)
      } else {
        setAlert({ type: 'info', msg: 'Session has not been started by the doctor yet.' })
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally { setJoiningId(null) }
  }

  const unpaidApprovedAppts = appts.filter(a => a.status === 'ACCEPTED' && a.paymentStatus !== 'PAID')

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">My Appointments</h2>
          <p className="page-header-sub">Track appointment requests, pay approved slots within 6 hours, or view refund receipts.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* 6-Hour Payment Due Notification Banner */}
      {unpaidApprovedAppts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1.5px solid #f59e0b',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 4px 20px rgba(245,158,11,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#fde68a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0
            }}>
              ⏰
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#92400e' }}>
                Doctor Approved! Complete Payment Within 6 Hours
              </div>
              <div style={{ fontSize: '0.84rem', color: '#78350f', marginTop: 2 }}>
                Dr. {unpaidApprovedAppts[0].doctor?.username} has accepted your appointment request (#{unpaidApprovedAppts[0].id}). Please pay the ₹{unpaidApprovedAppts[0].consultationFee || 500} fee to confirm your booking, or it will be automatically cancelled.
              </div>
            </div>
          </div>
          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #d97706, #b45309)',
              color: '#ffffff', fontWeight: 800, fontSize: '0.88rem',
              padding: '11px 20px', border: 'none', borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              boxShadow: '0 4px 14px rgba(180,83,9,0.35)'
            }}
            onClick={() => setPayingAppt(unpaidApprovedAppts[0])}
          >
            <CreditCard size={16} /> Pay ₹{unpaidApprovedAppts[0].consultationFee || 500} Now
          </button>
        </div>
      )}

      {/* Real-time Session Started Alert Banner */}
      {activeSessionAlert && (
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #059669 100%)',
          color: '#ffffff',
          padding: '18px 22px',
          borderRadius: 14,
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 8px 30px rgba(22, 163, 74, 0.45)',
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
            }}>
              👨‍⚕️
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                Dr. {activeSessionAlert.doctorName} has started your consultation session!
              </div>
              <div style={{ fontSize: '0.86rem', opacity: 0.95, marginTop: 2 }}>
                The doctor is currently in the room waiting for you. Join now to start your meeting.
              </div>
            </div>
          </div>
          <button
            className="btn"
            style={{
              background: '#ffffff', color: '#15803d', fontWeight: 800, fontSize: '0.9rem',
              padding: '12px 22px', border: 'none', borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
            onClick={() => navigate(`/session/${activeSessionAlert.roomId}`)}
          >
            <Video size={17} /> Join Consultation Now
          </button>
        </div>
      )}

      <Alert {...(alert || {})} msg={alert?.msg} onClose={() => setAlert(null)} />
      <div className="card">
        <div className="card-header">
          <div className="card-title"><ClipboardList size={16} /> Appointment History</div>
          <span style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-400)' }}>{appts.length} record(s)</span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>ID</th><th>Doctor</th><th>Date</th><th>Time Slot</th><th>Status</th><th>Fee / Payment</th><th>Action</th>
            </tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7}><div className="page-spinner"><span className="spinner" /> Loading...</div></td></tr>
                : appts.length === 0
                  ? <tr><td colSpan={7}><div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <div className="empty-title">No appointments yet</div>
                      <div className="empty-text">Book an appointment from "Find a Doctor" — it will appear here.</div>
                    </div></td></tr>
                  : appts.map(a => {
                      const slot = a.availabilitySlot || {}
                      const sess = sessionMap[a.id]
                      const isPaid = a.paymentStatus === 'PAID'
                      const isRefunded = a.paymentStatus === 'REFUNDED'
                      const isAccepted = a.status === 'ACCEPTED'
                      const isPending = a.status === 'PENDING'

                      return (
                        <tr key={a.id}>
                          <td><strong>{a.id}</strong></td>
                          <td>Dr. {a.doctor?.username || '—'}</td>
                          <td>{fmtDate(slot.date)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</td>
                          <td>
                            {statusBadge(a.status, a.paymentStatus, a.paymentDeadline)}
                            {a.cancellationReason && (a.status === 'CANCELLED' || a.status === 'REJECTED') && (
                              <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, lineHeight: 1.3, maxWidth: 170 }}>
                                {a.cancellationReason}
                              </div>
                            )}
                          </td>
                          <td>
                            {isPaid ? (
                              <div>
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                  ✓ Paid ₹{a.consultationFee || 500}
                                </span>
                                {a.transactionId && (
                                  <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                                    {a.transactionId}
                                  </div>
                                )}
                              </div>
                            ) : isRefunded ? (
                              <div>
                                <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 800 }}>
                                  💰 100% Refunded (₹{a.refundAmount || a.consultationFee || 500})
                                </span>
                                {a.refundTransactionId && (
                                  <div style={{ fontSize: '0.66rem', color: '#059669', fontFamily: 'monospace', marginTop: 2 }}>
                                    Refund ID: {a.refundTransactionId}
                                  </div>
                                )}
                              </div>
                            ) : isAccepted ? (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                  color: '#fff', fontWeight: 800, padding: '5px 12px', fontSize: '0.78rem',
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  boxShadow: '0 3px 10px rgba(37,99,235,0.3)'
                                }}
                                onClick={() => setPayingAppt(a)}
                              >
                                <CreditCard size={12} /> Pay ₹{a.consultationFee || 500} Now
                              </button>
                            ) : isPending ? (
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                ₹{a.consultationFee || 500} (Pay upon approval)
                              </div>
                            ) : (
                              <span style={{ color: 'var(--clr-neutral-400)', fontSize: '0.78rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {isAccepted && (
                                isPaid ? (
                                  sess?.active
                                    ? <button
                                        className="btn btn-primary btn-sm"
                                        style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 3px 10px rgba(34,197,94,0.35)', fontWeight: 700 }}
                                        onClick={() => joinSession(a.id)}
                                        disabled={joiningId === a.id}
                                      >
                                        {joiningId === a.id ? '...' : <><Video size={13} /> Join Session</>}
                                      </button>
                                    : <span className="badge" style={{ background: 'rgba(107,114,128,0.12)', color: '#6b7280' }}>Awaiting doctor</span>
                                ) : (
                                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 600 }}>
                                    Pay to join room
                                  </span>
                                )
                              )}
                              {(a.status === 'PENDING' || a.status === 'ACCEPTED') && (
                                <>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    title="Reschedule Appointment"
                                    onClick={() => setReschedulingAppt(a)}
                                    style={{ padding: '5px 9px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <CalendarClock size={12} /> Reschedule
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    title="Cancel Appointment"
                                    onClick={() => setCancellingAppt(a)}
                                    style={{ padding: '5px 9px', fontSize: '0.74rem', color: '#ef4444', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <X size={12} /> Cancel
                                  </button>
                                </>
                              )}
                              {a.status === 'COMPLETED' && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-400)' }}>Completed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {payingAppt && (
        <AppointmentPaymentModal
          appointment={payingAppt}
          onClose={() => setPayingAppt(null)}
          onSuccess={(updated) => {
            setAlert({ type: 'success', msg: `✅ Payment of ₹${updated.consultationFee || 500} recorded successfully! (Txn ID: ${updated.transactionId || 'CONFIRMED'})` })
            load()
          }}
        />
      )}

      {/* Cancel Appointment Modal */}
      {cancellingAppt && (
        <CancelAppointmentModal
          appointment={cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onSuccess={() => {
            setAlert({ type: 'info', msg: 'Appointment successfully cancelled and doctor slot released.' })
            load()
          }}
        />
      )}

      {/* Reschedule Appointment Modal */}
      {reschedulingAppt && (
        <RescheduleAppointmentModal
          appointment={reschedulingAppt}
          onClose={() => setReschedulingAppt(null)}
          onSuccess={() => {
            setAlert({ type: 'success', msg: 'Appointment successfully rescheduled to the selected slot.' })
            load()
          }}
        />
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

/* -- My Documents section ------------------- */
function fmtDocIcon(mime) {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.includes('pdf'))      return '📕'
  if (mime.includes('word') || mime.includes('document')) return '📝'
  return '📄'
}
function fmtDocSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MyDocsSection() {
  const [docs, setDocs]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [alert, setAlert]       = useState(null)
  const [docToDelete, setDocToDelete] = useState(null)
  const fileInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setDocs(await apiGetMyDocuments() || []) }
    catch (err) { setAlert({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(file) {
    if (!file) return
    setUploading(true); setAlert(null)
    try {
      await apiUploadDocument(file, null)
      setAlert({ type: 'success', msg: `"${file.name}" uploaded successfully!` })
      await load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Upload failed.' })
    } finally { setUploading(false) }
  }

  async function confirmDeleteDoc() {
    if (!docToDelete) return
    const id = docToDelete.id
    const name = docToDelete.originalName
    setDocToDelete(null)
    try {
      await apiDeleteDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
      setAlert({ type: 'success', msg: `Document "${name}" deleted.` })
    } catch (err) { setAlert({ type: 'error', msg: err.message || 'Failed to delete document.' }) }
  }

  function openFile(id) {
    const token = getToken()
    fetch(apiDocFileUrl(id), { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) throw new Error('Could not fetch document. You may not have access or it may be removed.')
        return r.blob()
      })
      .then(blob => window.open(URL.createObjectURL(blob), '_blank'))
      .catch((err) => setAlert({ type: 'error', msg: err.message || 'Could not open file.' }))
  }

  return (
    <div className="view-section">
      {/* Custom Confirmation Modal */}
      <ProjectConfirmModal
        isOpen={!!docToDelete}
        title="Delete Medical Document"
        message={`Are you sure you want to delete "${docToDelete?.originalName}"? This action cannot be undone and doctors will no longer be able to view this file.`}
        confirmText="Delete Document"
        confirmVariant="danger"
        onConfirm={confirmDeleteDoc}
        onCancel={() => setDocToDelete(null)}
      />

      <div className="page-header">
        <div>
          <h2 className="page-header-title">My Medical Documents</h2>
          <p className="page-header-sub">Upload and manage your medical reports. Doctors can view them during a session only.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { handleUpload(e.target.files[0]); e.target.value = '' }} />
        </div>
      </div>
      <Alert {...(alert || {})} msg={alert?.msg} onClose={() => setAlert(null)} />
      {loading
        ? <div className="page-spinner"><span className="spinner" /> Loading documents...</div>
        : docs.length === 0
          ? <div className="card"><div className="card-body"><div className="empty-state">
              <div className="empty-icon">📂</div>
              <div className="empty-title">No documents uploaded</div>
              <div className="empty-text">Upload medical reports so your doctor can review them during your consultation session.</div>
            </div></div></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {docs.map(doc => (
                <div key={doc.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: '1.8rem' }}>{fmtDocIcon(doc.mimeType)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-neutral-500)', marginTop: 2 }}>
                      {fmtDocSize(doc.fileSize)} &middot; {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-outline btn-sm" style={{ padding: '5px 12px' }} onClick={() => openFile(doc.id)}>
                      <Eye size={13} /> View
                    </button>
                    <button className="btn btn-sm" style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }} onClick={() => setDocToDelete(doc)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}

/* -- My Prescriptions section --------------- */

function parseTimeComponents(timeStr) {
  if (!timeStr) return null
  const cleaned = timeStr.trim().toUpperCase()
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const ampm = match[3]

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
  } else {
    if (hours >= 1 && hours <= 6) hours += 12
  }
  return { hours, minutes }
}

/** Details about the ±1 hour window for a given scheduled time (supports AM/PM & 24h formats) */
function getWindowDetails(scheduledTimeStr) {
  if (!scheduledTimeStr) return { inWindow: false, isPast: false, isUpcoming: false, startFmt: '', endFmt: '' }
  const comp = parseTimeComponents(scheduledTimeStr)
  if (!comp) return { inWindow: false, isPast: false, isUpcoming: false, startFmt: '', endFmt: '' }

  const now = new Date()
  const scheduled = new Date()
  scheduled.setHours(comp.hours, comp.minutes, 0, 0)
  const windowStart = new Date(scheduled.getTime() - 60 * 60 * 1000)
  const windowEnd   = new Date(scheduled.getTime() + 60 * 60 * 1000)

  const inWindow   = now >= windowStart && now <= windowEnd
  const isPast     = now > windowEnd
  const isUpcoming = now < windowStart

  const startFmt = windowStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const endFmt   = windowEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return { inWindow, isPast, isUpcoming, startFmt, endFmt }
}

function isWithinWindow(scheduledTimeStr) {
  return getWindowDetails(scheduledTimeStr).inWindow
}

function fmt12(timeStr) {
  if (!timeStr) return ''
  const comp = parseTimeComponents(timeStr)
  if (!comp) return timeStr.trim()
  const d = new Date()
  d.setHours(comp.hours, comp.minutes, 0, 0)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/** Calculates medicine course metrics: day number, remaining days, active vs completed */
function getMedicineCourseInfo(issuedAt, durationDays) {
  const total = parseInt(durationDays) || 5
  if (!issuedAt) {
    return {
      totalDays: total,
      currentDay: 1,
      elapsedDays: 1,
      remainingDays: total,
      isCompleted: false,
      isOngoing: true,
      startDateStr: 'Today',
      endDateStr: `${total} days`,
    }
  }

  const issued = Array.isArray(issuedAt)
    ? new Date(issuedAt[0], issuedAt[1] - 1, issuedAt[2])
    : new Date(issuedAt)
  issued.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffMs = today.getTime() - issued.getTime()
  const elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1 // Day 1 on issue day

  const endDate = new Date(issued)
  endDate.setDate(issued.getDate() + (total - 1))

  const isCompleted = elapsedDays > total
  const currentDay = Math.min(Math.max(1, elapsedDays), total)
  const remainingDays = Math.max(0, total - elapsedDays + 1)

  return {
    totalDays: total,
    currentDay,
    elapsedDays,
    remainingDays,
    isCompleted,
    isOngoing: !isCompleted && elapsedDays >= 1,
    startDateStr: issued.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    endDateStr: endDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }
}

function PrescriptionsSection() {
  const [prescriptions, setPrescriptions] = useState([])
  const [reminders, setReminders]         = useState([])
  const [adherence, setAdherence]         = useState(null)
  const [logs, setLogs]                   = useState([])
  const [loading, setLoading]             = useState(false)
  const [alert, setAlert]                 = useState(null)
  const [takingId, setTakingId]           = useState(null)
  const [snoozedDoses, setSnoozedDoses]   = useState({}) // key -> timestamp until snoozed
  const [confirmDeleteRxId, setConfirmDeleteRxId] = useState(null)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderForm, setReminderForm]   = useState({ medicineName: '', dosage: '', scheduleType: 'DAILY', scheduledTimes: '09:00 AM', instructions: '' })
  const [, tick] = useState(0)
  const [printingRx, setPrintingRx] = useState(null)

  // Order & Billing state
  const [orderPrescriptionId, setOrderPrescriptionId]   = useState(null)
  const [availabilityCheck, setAvailabilityCheck]     = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [placingOrder, setPlacingOrder]                 = useState(false)
  const [orderInvoice, setOrderInvoice]                 = useState(null)
  const [myOrders, setMyOrders]                         = useState([])

  // Lock body scrolling when modal is open
  useEffect(() => {
    if (orderPrescriptionId || confirmDeleteRxId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [orderPrescriptionId, confirmDeleteRxId])

  const todayStr = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    setLoading(true)
    setAlert(null)
    try {
      const rxData = await apiGetMyPrescriptions().catch(e => { console.error("rx err", e); return [] })
      const logData = await apiGetMedicineLogs().catch(e => { console.error("log err", e); return [] })
      const remData = await apiGetReminders().catch(e => { console.error("rem err", e); return [] })
      const adhData = await apiGetAdherence().catch(e => { console.error("adh err", e); return null })
      const ordersData = await apiGetMyMedicineOrders().catch(e => { console.error("ord err", e); return [] })

      setPrescriptions(Array.isArray(rxData) ? rxData : [])
      setReminders(Array.isArray(remData) ? remData : [])
      setAdherence(adhData && typeof adhData === 'object' && !adhData.error ? adhData : null)
      setMyOrders(Array.isArray(ordersData) ? ordersData : [])

      const validLogs = Array.isArray(logData) ? logData : []
      const todayLogs = validLogs.filter(l => {
        if (!l || !l.logDate) return false
        const ld = Array.isArray(l.logDate)
          ? `${l.logDate[0]}-${String(l.logDate[1]).padStart(2,'0')}-${String(l.logDate[2]).padStart(2,'0')}`
          : l.logDate
        return ld === todayStr
      })
      setLogs(todayLogs)
    } catch (err) {
      console.error("Load failed", err)
      setAlert({ type: 'error', msg: err.message || 'Failed to load prescriptions.' })
    } finally { setLoading(false) }
  }, [todayStr])

  async function handleOpenOrderModal(prescriptionId) {
    setOrderPrescriptionId(prescriptionId)
    setCheckingAvailability(true)
    setAvailabilityCheck(null)
    setOrderInvoice(null)
    try {
      const res = await apiCheckPrescriptionAvailability(prescriptionId)
      setAvailabilityCheck(res)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to check pharmacy availability.' })
      setOrderPrescriptionId(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleConfirmOrder() {
    if (!orderPrescriptionId) return
    setPlacingOrder(true)
    try {
      const orderRes = await apiPlaceMedicineOrder(orderPrescriptionId)
      setOrderInvoice(orderRes)
      setAlert({ type: 'success', msg: `🎉 Prescription Order ID: ${orderRes.id} placed successfully! Inventory updated.` })
      const orders = await apiGetMyMedicineOrders().catch(() => [])
      setMyOrders(Array.isArray(orders) ? orders : [])
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to place medicine order.' })
    } finally {
      setPlacingOrder(false)
    }
  }

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handleUpdate = () => load()
    window.addEventListener('prescription_updated', handleUpdate)
    return () => window.removeEventListener('prescription_updated', handleUpdate)
  }, [load])

  useEffect(() => {
    const iv = setInterval(() => tick(t => t + 1), 30_000)
    return () => clearInterval(iv)
  }, [])

  function isTaken(medicineId, scheduledTime) {
    if (!medicineId || !scheduledTime) return false
    const safeLogs = Array.isArray(logs) ? logs : []
    return safeLogs.some(l => l && l.medicine && l.medicine.id === medicineId && l.scheduledTime === scheduledTime)
  }

  function handleSnooze(key) {
    const until = Date.now() + 15 * 60 * 1000
    setSnoozedDoses(prev => ({ ...prev, [key]: until }))
    setAlert({ type: 'info', msg: '⏰ Reminder snoozed for 15 minutes.' })
  }

  function isSnoozed(key) {
    const until = snoozedDoses[key]
    return until && Date.now() < until
  }

  async function handleCreateReminder(e) {
    e.preventDefault()
    if (!reminderForm.medicineName.trim() || !reminderForm.scheduledTimes.trim()) return
    try {
      await apiCreateReminder(reminderForm)
      setAlert({ type: 'success', msg: `Medication reminder "${reminderForm.medicineName}" created successfully!` })
      setReminderForm({ medicineName: '', dosage: '', scheduleType: 'DAILY', scheduledTimes: '09:00 AM', instructions: '' })
      setShowReminderForm(false)
      await load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to create reminder.' })
    }
  }

  async function handleDeleteReminder(id) {
    try {
      await apiDeleteReminder(id)
      setAlert({ type: 'success', msg: 'Reminder deleted.' })
      await load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to delete reminder.' })
    }
  }

  async function confirmDeletePrescription() {
    if (!confirmDeleteRxId) return
    const id = confirmDeleteRxId
    try {
      await apiDeletePrescription(id)
      setAlert({ type: 'success', msg: `Prescription ID: ${id} deleted successfully.` })
      setConfirmDeleteRxId(null)
      await load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to delete prescription.' })
    }
  }

  async function handleMarkTaken(medicine, scheduledTime) {
    if (!medicine || !medicine.id) return
    const winDetails = getWindowDetails(scheduledTime)
    if (winDetails.isPast) {
      setAlert({ type: 'warning', msg: `⚠️ The time window for this dose (${fmt12(scheduledTime)}) has already passed.` })
      return
    }
    const key = `${medicine.id}_${scheduledTime}`
    setTakingId(key)
    setAlert(null)
    try {
      const log = await apiMarkMedicineTaken({
        medicineId: medicine.id,
        scheduledTime,
        logDate: todayStr,
      })
      setLogs(prev => [...(Array.isArray(prev) ? prev : []), log])
      setAlert({ type: 'success', msg: `✅ ${medicine.medicineName} marked as taken for ${fmt12(scheduledTime)}!` })
      await load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to mark as taken.' })
    } finally { setTakingId(null) }
  }

  let totalDosesToday = 0
  let takenDosesToday = 0
  let openWindowDosesToday = 0

  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : []
  const safeReminders     = Array.isArray(reminders) ? reminders : []
  const safeOrders        = Array.isArray(myOrders) ? myOrders : []

  safePrescriptions.forEach(rx => {
    if (!rx || !rx.medicines) return
    (rx.medicines || []).forEach(med => {
      if (!med) return
      const course = getMedicineCourseInfo(rx.issuedAt, med.durationDays)
      // Only count doses for medicines whose prescribed course is active today
      if (course.isCompleted) return

      const times = (med.scheduledTimes || '').split(',').map(t => t.trim()).filter(Boolean)
      times.forEach(t => {
        totalDosesToday++
        if (isTaken(med.id, t)) {
          takenDosesToday++
        } else if (isWithinWindow(t)) {
          openWindowDosesToday++
        }
      })
    })
  })

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Medication Tracker & Prescriptions</h2>
          <p className="page-header-sub">Track daily medicine intake, custom reminder schedules, and adherence analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowReminderForm(!showReminderForm)}>
            <Pill size={14} /> {showReminderForm ? 'Cancel Form' : 'Add Medication Reminder'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} /> {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Custom Reminder Form */}
      {showReminderForm && (
        <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(145deg, #1e293b, #0f172a)', color: '#fff' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="card-title" style={{ color: '#fff' }}><Pill size={16} color="#60a5fa" /> Create Medication Schedule</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateReminder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Medicine Name *</label>
                <input className="form-input" placeholder="e.g. Paracetamol" value={reminderForm.medicineName} onChange={e => setReminderForm(f => ({ ...f, medicineName: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Dosage</label>
                <input className="form-input" placeholder="e.g. 500mg" value={reminderForm.dosage} onChange={e => setReminderForm(f => ({ ...f, dosage: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Schedule Frequency</label>
                <select className="form-input" value={reminderForm.scheduleType} onChange={e => setReminderForm(f => ({ ...f, scheduleType: e.target.value }))}>
                  <option value="DAILY">Daily</option>
                  <option value="ALTERNATE_DAYS">Alternate Days</option>
                  <option value="CUSTOM">Custom Timing</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Scheduled Time(s) *</label>
                <input className="form-input" placeholder="e.g. 08:00 AM, 08:00 PM or 09:00" value={reminderForm.scheduledTimes} onChange={e => setReminderForm(f => ({ ...f, scheduledTimes: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Instructions</label>
                <input className="form-input" placeholder="e.g. After meals with warm water" value={reminderForm.instructions} onChange={e => setReminderForm(f => ({ ...f, instructions: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adherence & Progress Summary */}
      {adherence && (
        <div style={{
          background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 22, color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
              📊 Medication Adherence Analytics
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
              {adherence.adherencePercent}% Adherence ({adherence.status})
            </div>
            {adherence.alertTriggered && (
              <div style={{ fontSize: '0.82rem', color: '#f87171', marginTop: 4, fontWeight: 600 }}>
                ⚠️ Warning: Adherence is below 70%! Automated alert sent to doctor.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ade80' }}>{takenDosesToday}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Taken Doses</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>{openWindowDosesToday}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Due Now</div>
            </div>
          </div>
        </div>
      )}

      {alert && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontSize: '0.86rem',
          background: alert.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alert.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${alert.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          cursor: 'pointer',
        }} onClick={() => setAlert(null)}>{alert.msg}</div>
      )}

      {loading
        ? <div className="page-spinner"><span className="spinner" /> Loading prescriptions…</div>
        : safePrescriptions.length === 0
          ? (
            <div className="card"><div className="card-body"><div className="empty-state">
              <div className="empty-icon">💊</div>
              <div className="empty-title">No prescriptions yet</div>
              <div className="empty-text">Your doctor will issue a prescription after your appointment. Check back here to track your medicines.</div>
            </div></div></div>
          )
          : safePrescriptions.map(rx => {
            if (!rx) return null
            const isAlreadyOrdered = safeOrders.some(o => o && o.prescription && o.prescription.id === rx.id)
            return (
              <div key={rx.id} className="card" style={{ marginBottom: 20 }}>
                {/* Prescription header */}
                <div className="card-header" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Pill size={16} color="#93c5fd" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                        Prescription ID: {rx.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
                        Issued by Dr. {rx.doctor?.username} · {rx.issuedAt ? new Date(Array.isArray(rx.issuedAt)
                          ? new Date(rx.issuedAt[0], rx.issuedAt[1]-1, rx.issuedAt[2], rx.issuedAt[3]||0, rx.issuedAt[4]||0)
                          : rx.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 12 }}>
                      {(rx.medicines||[]).length} medicine(s)
                    </span>

                    <button
                      type="button"
                      onClick={() => setPrintingRx(rx)}
                      title="Print or Save Official Digital Prescription PDF"
                      style={{
                        background: 'rgba(255,255,255,0.18)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#ffffff',
                        borderRadius: 8,
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Printer size={13} /> Print / PDF
                    </button>

                    {isAlreadyOrdered ? (
                      <span style={{
                        background: '#dcfce7',
                        border: '1.5px solid #86efac',
                        color: '#166534',
                        borderRadius: 8,
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 8px rgba(34,197,94,0.2)',
                      }}>
                        ✓ Order Confirmed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenOrderModal(rx.id)}
                        title="Check Pharmacy Availability & Order"
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: 8,
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                        }}
                      >
                        <ShoppingBag size={14} /> Order Medicines
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteRxId(rx.id)}
                      title="Delete Prescription"
                      style={{
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        borderRadius: 8,
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>

              {/* Medicine cards */}
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(rx.medicines || []).map(med => {
                  const times = (med.scheduledTimes || '').split(',').map(t => t.trim()).filter(Boolean)
                  const course = getMedicineCourseInfo(rx.issuedAt, med.durationDays)

                  return (
                    <div key={med.id} style={{
                      border: `1.5px solid ${course.isCompleted ? '#e2e8f0' : 'var(--clr-neutral-200)'}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      opacity: course.isCompleted ? 0.88 : 1,
                    }}>
                      {/* Medicine header */}
                      <div style={{
                        background: course.isCompleted
                          ? '#f8fafc'
                          : 'linear-gradient(90deg,rgba(37,99,235,0.06),rgba(20,184,166,0.05))',
                        borderBottom: '1px solid var(--clr-neutral-100)',
                        padding: '12px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: course.isCompleted ? '#475569' : 'var(--clr-neutral-900)' }}>
                              💊 {med.medicineName}
                            </span>
                            <span style={{
                              background: course.isCompleted ? '#e2e8f0' : '#ecfdf5',
                              color: course.isCompleted ? '#475569' : '#047857',
                              border: `1px solid ${course.isCompleted ? '#cbd5e1' : '#a7f3d0'}`,
                              borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.74rem'
                            }}>
                              ⏱️ {course.totalDays} Days Course
                            </span>
                            {course.isCompleted ? (
                              <span style={{
                                background: '#f1f5f9', color: '#64748b',
                                border: '1px solid #cbd5e1', borderRadius: 6,
                                padding: '2px 8px', fontWeight: 700, fontSize: '0.74rem'
                              }}>
                                🏁 Course Completed
                              </span>
                            ) : (
                              <span style={{
                                background: '#eff6ff', color: '#1d4ed8',
                                border: '1px solid #bfdbfe', borderRadius: 6,
                                padding: '2px 8px', fontWeight: 700, fontSize: '0.74rem'
                              }}>
                                🟢 Day {course.currentDay} of {course.totalDays} ({course.remainingDays} day(s) left)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--clr-primary-50)', color: 'var(--clr-primary-700)', border: '1px solid var(--clr-primary-200)', borderRadius: 6, padding: '1px 8px', fontWeight: 600 }}>{med.dosage}</span>
                            <span>{med.timesPerDay}× per day</span>
                            {med.instructions && <span style={{ color: 'var(--clr-neutral-600)', fontWeight: 500 }}>· {med.instructions}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Course Duration & Progress Track Banner */}
                      <div style={{
                        background: course.isCompleted ? '#f1f5f9' : '#f8fafc',
                        padding: '9px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 700, color: course.isCompleted ? '#64748b' : '#1e3a8a' }}>
                            {course.isCompleted
                              ? `🏁 Prescribed Course Completed (${course.totalDays} of ${course.totalDays} Days)`
                              : `📅 Schedule: Day ${course.currentDay} of ${course.totalDays} (${course.remainingDays} day(s) remaining)`}
                          </span>
                          <span style={{ color: '#cbd5e1' }}>•</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{course.startDateStr} → {course.endDateStr}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
                          <div style={{ flex: 1, height: 7, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{
                              width: `${course.isCompleted ? 100 : Math.round((course.currentDay / course.totalDays) * 100)}%`,
                              height: '100%',
                              background: course.isCompleted ? '#94a3b8' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                              borderRadius: 10,
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: course.isCompleted ? '#64748b' : '#10b981' }}>
                            {course.isCompleted ? '100%' : `${Math.round((course.currentDay / course.totalDays) * 100)}%`}
                          </span>
                        </div>
                      </div>

                      {/* Dose time rows */}
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {times.map(t => {
                          if (course.isCompleted) {
                            return (
                              <div key={t} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px',
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: 10,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 38, height: 38, borderRadius: '50%',
                                    background: '#e2e8f0', color: '#64748b',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    fontWeight: 800, fontSize: '0.9rem'
                                  }}>
                                    ✓
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#64748b' }}>
                                      {fmt12(t)}
                                    </div>
                                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 1 }}>
                                      Prescribed {course.totalDays}-day course concluded on {course.endDateStr}. No doses due.
                                    </div>
                                  </div>
                                </div>
                                <span style={{
                                  background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1',
                                  borderRadius: 20, padding: '5px 12px', fontSize: '0.76rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                  🏁 Course Concluded
                                </span>
                              </div>
                            )
                          }

                          const taken = isTaken(med.id, t)
                          const winDetails = getWindowDetails(t)
                          const { inWindow, isPast, isUpcoming, startFmt, endFmt } = winDetails
                          const loadKey = `${med.id}_${t}`
                          const isLoading = takingId === loadKey

                          return (
                            <div key={t} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: taken
                                ? 'linear-gradient(90deg,#f0fdf4,#ecfdf5)'
                                : inWindow
                                  ? 'linear-gradient(90deg,#eff6ff,#f0f9ff)'
                                  : '#fafafa',
                              border: `1.5px solid ${taken ? '#bbf7d0' : inWindow ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: 10,
                              boxShadow: inWindow && !taken ? '0 2px 10px rgba(59,130,246,0.15)' : 'none',
                              transition: 'all 0.2s',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 38, height: 38, borderRadius: '50%',
                                  background: taken
                                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                                    : inWindow
                                      ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                                      : '#e5e7eb',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                  {taken
                                    ? <CheckCircle2 size={18} color="#fff" />
                                    : <Clock size={16} color={inWindow ? '#fff' : '#9ca3af'} />
                                  }
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: taken ? '#166534' : inWindow ? '#1d4ed8' : 'var(--clr-neutral-700)' }}>
                                    {fmt12(t)}
                                  </div>
                                  <div style={{ fontSize: '0.73rem', color: taken ? '#15803d' : inWindow ? '#2563eb' : 'var(--clr-neutral-400)', marginTop: 1, fontWeight: inWindow ? 600 : 400 }}>
                                    {taken
                                      ? `✅ Marked as taken for today (Day ${course.currentDay} of ${course.totalDays})`
                                      : inWindow
                                        ? `⏰ Time to take! Window open: ${startFmt} – ${endFmt} (Day ${course.currentDay} of ${course.totalDays})`
                                        : isUpcoming
                                          ? `⏳ Upcoming (Window opens at ${startFmt})`
                                          : `❌ Window passed at ${endFmt}`}
                                  </div>
                                </div>
                              </div>

                              {taken ? (
                                <span style={{
                                  background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
                                  borderRadius: 20, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
                                }}>
                                  <CheckCircle2 size={13} /> Taken Today
                                </span>
                              ) : (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    disabled={isLoading || isPast}
                                    onClick={() => handleMarkTaken(med, t)}
                                    title={isPast ? `Time window passed at ${endFmt}. Dose cannot be marked as taken.` : "Click to mark dose as taken for today"}
                                    style={{
                                      padding: '7px 18px', borderRadius: 20, fontWeight: 700, fontSize: '0.8rem',
                                      cursor: (isLoading || isPast) ? 'not-allowed' : 'pointer',
                                      border: isPast ? '1px solid #cbd5e1' : 'none',
                                      background: isPast ? '#e2e8f0' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                                      color: isPast ? '#64748b' : '#fff',
                                      boxShadow: isPast ? 'none' : '0 3px 12px rgba(37,99,235,0.35)',
                                      opacity: isPast ? 0.75 : 1,
                                      transition: 'all 0.2s',
                                      display: 'flex', alignItems: 'center', gap: 5,
                                    }}
                                  >
                                    {isLoading
                                      ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Marking…</>
                                      : <><CheckCircle2 size={13} /> Mark as Taken</>}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

      {/* Custom Medication Reminders Section */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-neutral-900)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Bell size={18} color="var(--clr-primary-600)" /> Custom Medication Reminders ({safeReminders.length})
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--clr-neutral-500)', margin: '2px 0 0 0' }}>
              Personalized reminder schedules created manually by you.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowReminderForm(true)}>
            + Create New Reminder
          </button>
        </div>

        {safeReminders.length === 0 ? (
          <div className="card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>⏰</div>
              <div style={{ fontWeight: 600, color: 'var(--clr-neutral-700)', fontSize: '0.92rem' }}>No custom reminders yet</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-neutral-500)', marginTop: 4 }}>
                Click "Add Medication Reminder" to set up custom pill reminders for your daily routine.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {safeReminders.map(rem => {
              if (!rem) return null
              return (
                <div key={rem.id || Math.random()} className="card" style={{ padding: 16, borderRadius: 12, border: '1.5px solid var(--clr-primary-200)', background: 'linear-gradient(145deg, #ffffff, #f0f7ff)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--clr-primary-900)' }}>
                        💊 {rem.medicineName}
                      </div>
                      {rem.dosage && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--clr-primary-100)', color: 'var(--clr-primary-800)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>
                          {rem.dosage}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleDeleteReminder(rem.id)}
                      title="Delete Reminder"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--clr-neutral-700)', marginTop: 6 }}>
                    <strong>Frequency:</strong> {rem.scheduleType || 'DAILY'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--clr-neutral-700)', marginTop: 4 }}>
                    <strong>Scheduled Times:</strong> <span style={{ color: 'var(--clr-primary-700)', fontWeight: 600 }}>{rem.scheduledTimes}</span>
                  </div>
                  {rem.instructions && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-500)', marginTop: 6, fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: 6 }}>
                      Note: {rem.instructions}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My Pharmacy Orders & Billing Section */}
      <div style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-neutral-900)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <ShoppingBag size={18} color="var(--clr-primary-600)" /> My Pharmacy Orders & Billing Receipts ({safeOrders.length})
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--clr-neutral-500)', margin: '2px 0 0 0' }}>
            History of orders placed for doctor prescriptions and medicine billing breakdowns.
          </p>
        </div>

        {safeOrders.length === 0 ? (
          <div className="card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>🛍️</div>
              <div style={{ fontWeight: 600, color: 'var(--clr-neutral-700)', fontSize: '0.92rem' }}>No prescription orders placed yet</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-neutral-500)', marginTop: 4 }}>
                Click "Order Medicines" on any prescription above to check availability and place an order.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {safeOrders.map(ord => {
              if (!ord) return null
              return (
                <div key={ord.id || Math.random()} className="card" style={{ border: '1.5px solid var(--clr-primary-200)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#1e293b' }}>Order ID: {ord.id}</span>
                    <span className="badge badge-success">{ord.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-neutral-600)', marginBottom: 8 }}>
                    🕒 Placed on {fmtDateTime(ord.orderedAt)}
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--clr-neutral-700)', marginBottom: 4 }}>Items Ordered:</div>
                    {ord.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                        <span>• {item.medicineName} ({item.sheetsOrdered} sheets)</span>
                        <span style={{ fontWeight: 600, color: '#166534' }}>₹{item.itemTotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-neutral-600)' }}>Total Paid (Inc. Tax):</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed' }}>₹{ord.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Prescription Modal */}
      {orderPrescriptionId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '88vh',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            margin: 'auto', animation: 'fadeInUp 0.25s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#ffffff',
              padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={18} color="#60a5fa" /> Pharmacy Prescription Order & Bill
              </div>
              <button
                onClick={() => setOrderPrescriptionId(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 22, maxHeight: '78vh', overflowY: 'auto' }}>
              {checkingAvailability ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                  <div style={{ marginTop: 12, fontWeight: 600, fontSize: '0.9rem', color: 'var(--clr-neutral-700)' }}>
                    Checking real-time pharmacy inventory availability…
                  </div>
                </div>
              ) : orderInvoice ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' }}>
                    Order ID: {orderInvoice.id} Placed Successfully!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--clr-neutral-600)', marginBottom: 18 }}>
                    Pharmacy stock counts have been automatically reduced. Your medicines are ready for collection/delivery.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: 10 }}>RECEIPT SUMMARY</div>
                    {orderInvoice.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                        <span>• {item.medicineName} ({item.sheetsOrdered} sheets)</span>
                        <span style={{ fontWeight: 600 }}>₹{item.itemTotal?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#7c3aed' }}>
                      <span>Total Amount Paid:</span>
                      <span>₹{orderInvoice.totalPrice?.toFixed(2)}</span>
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={() => setOrderPrescriptionId(null)} style={{ width: '100%' }}>
                    Done & Close
                  </button>
                </div>
              ) : availabilityCheck ? (
                <div>
                  <div style={{ marginBottom: 16, fontSize: '0.88rem' }}>
                    <strong>Prescription ID: {availabilityCheck.prescriptionId}</strong> · Doctor: Dr. {availabilityCheck.doctorName}
                  </div>

                  {/* Availability List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {availabilityCheck.items?.map((item, idx) => (
                      <div key={idx} style={{
                        padding: 14, borderRadius: 10, border: `1.5px solid ${item.available ? '#bbf7d0' : '#fecaca'}`,
                        background: item.available ? '#f0fdf4' : '#fef2f2',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--clr-neutral-900)' }}>
                            💊 {item.medicineName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--clr-neutral-600)', marginTop: 2 }}>
                            Requires: <strong>{item.sheetsNeeded} sheet(s)</strong> ({item.tabletsPerSheet} tabs/sheet) · Stock: {item.sheetsInStock} sheets
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>
                            {item.available ? (
                              <span className="badge badge-success">Available</span>
                            ) : (
                              <span className="badge badge-error">Out of Stock</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534', marginTop: 4 }}>
                            ₹{item.itemTotal?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Billing Calculation Breakdown */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155', marginBottom: 10 }}>
                      📋 INVOICE & BILLING BREAKDOWN
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                      <span>Subtotal (Medicine Sheets):</span>
                      <span style={{ fontWeight: 600 }}>₹{availabilityCheck.subtotal?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                      <span>GST (5% Tax):</span>
                      <span style={{ fontWeight: 600 }}>₹{availabilityCheck.tax?.toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: '1.5px solid #cbd5e1', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
                      <span>Grand Total:</span>
                      <span>₹{availabilityCheck.grandTotal?.toFixed(2)}</span>
                    </div>
                  </div>

                  {!availabilityCheck.allAvailable && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.82rem', marginBottom: 16 }}>
                      ⚠️ One or more medicines are currently out of stock in the pharmacy. Order placement is disabled until restocked.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => setOrderPrescriptionId(null)} style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!availabilityCheck.allAvailable || placingOrder}
                      onClick={handleConfirmOrder}
                      style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                    >
                      {placingOrder ? 'Processing Order…' : '💳 Place Order & Deduct Inventory'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Delete Prescription Confirmation Modal */}
      <ProjectConfirmModal
        isOpen={Boolean(confirmDeleteRxId)}
        title={`Delete Prescription ID: ${confirmDeleteRxId}`}
        message="Are you sure you want to delete this prescription? This action will remove all associated medication schedules and cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDeletePrescription}
        onCancel={() => setConfirmDeleteRxId(null)}
      />

      {/* Official Digital Prescription PDF Printable Modal */}
      {printingRx && (
        <PrintPrescriptionModal
          prescription={printingRx}
          onClose={() => setPrintingRx(null)}
        />
      )}
    </div>
  )
}

/* -- Profile ------------------------------- */
function ProfileSection() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    medicalHistory: '',
    allergies: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await apiGetPatientProfile()
        if (data) {
          setProfile({
            fullName: data.fullName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            age: data.age !== null && data.age !== undefined ? data.age : '',
            gender: data.gender || 'Male',
            bloodGroup: data.bloodGroup || 'O+',
            emergencyContactName: data.emergencyContactName || '',
            emergencyContactPhone: data.emergencyContactPhone || '',
            address: data.address || '',
            medicalHistory: data.medicalHistory || '',
            allergies: data.allergies || ''
          })
        }
      } catch (err) {
        // Fallback gracefully to default
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      await apiSavePatientProfile({
        ...profile,
        age: profile.age ? parseInt(profile.age, 10) : null
      })
      setAlert({ type: 'success', msg: '✅ Patient profile details saved and synced successfully!' })
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to save patient profile.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">My Profile & Clinical Details</h2>
          <p className="page-header-sub">Manage your personal information, emergency contacts, and medical history.</p>
        </div>
      </div>

      {alert && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontSize: '0.88rem',
          background: alert.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alert.type === 'success' ? '#166534' : '#991b1b',
          border: `1.5px solid ${alert.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {alert.msg}
        </div>
      )}

      {loading ? (
        <div className="page-spinner"><span className="spinner" /> Loading profile details…</div>
      ) : (
        <form onSubmit={handleSaveProfile}>
          {/* Account Overview + Basic Info */}
          <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
            {/* Account Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">👤 Account & Login Credentials</div>
              </div>
              <div className="card-body">
                <table className="tbl">
                  <tbody>
                    <tr><td style={{ fontWeight: 600, color: '#64748b', width: 120 }}>Username</td><td style={{ fontWeight: 700, color: '#0f172a' }}>{getUsername()}</td></tr>
                    <tr><td style={{ fontWeight: 600, color: '#64748b' }}>Account Role</td><td><span className="badge badge-primary">PATIENT</span></td></tr>
                    <tr><td style={{ fontWeight: 600, color: '#64748b' }}>Account Status</td><td><span className="badge badge-success">Active & Verified</span></td></tr>
                    <tr><td style={{ fontWeight: 600, color: '#64748b' }}>Hospital ID</td><td style={{ fontWeight: 600, color: '#0284c7' }}>MC-PAT-{getUsername()}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Basic Personal Details */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📝 Basic Personal Information</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="Enter your full name"
                    value={profile.fullName}
                    onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. name@example.com"
                      value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Phone Number</label>
                    <input
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={profile.phoneNumber}
                      onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Age</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 28"
                      value={profile.age}
                      onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Gender</label>
                    <select
                      className="form-input"
                      value={profile.gender}
                      onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Blood Group</label>
                    <select
                      className="form-input"
                      value={profile.bloodGroup}
                      onChange={e => setProfile(p => ({ ...p, bloodGroup: e.target.value }))}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency & Medical History Details */}
          <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
            {/* Emergency & Address */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🚨 Emergency Contact & Address</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Emergency Contact Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Parent, Spouse or Guardian name"
                    value={profile.emergencyContactName}
                    onChange={e => setProfile(p => ({ ...p, emergencyContactName: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Emergency Contact Phone</label>
                  <input
                    className="form-input"
                    placeholder="+91 98765 00000"
                    value={profile.emergencyContactPhone}
                    onChange={e => setProfile(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Residential Address</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Street, Apartment, City, State, PIN code"
                    value={profile.address}
                    onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Medical History & Allergies */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🩺 Clinical History & Known Allergies</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Known Allergies</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Dust, Latex..."
                    value={profile.allergies}
                    onChange={e => setProfile(p => ({ ...p, allergies: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Chronic Conditions / Medical History</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma, past surgeries..."
                    value={profile.medicalHistory}
                    onChange={e => setProfile(p => ({ ...p, medicalHistory: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '0.95rem', fontWeight: 800, width: 'auto' }}
            >
              {saving ? 'Saving Details…' : 'Save Patient Profile Details'}
            </button>
          </div>
        </form>
      )}

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
            <label className="form-label">Current Password *</label>
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

/* -- Emergency SOS ─────────────────────── */
function EmergencySOSButton({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 900,
        background: 'linear-gradient(135deg,#dc2626,#991b1b)',
        color: '#fff', border: 'none', borderRadius: '50%',
        width: 64, height: 64, cursor: 'pointer',
        boxShadow: '0 0 0 0 rgba(220,38,38,0.7)',
        animation: 'emergencyPulse 2s infinite',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.03em',
      }}
      title="Emergency SOS — Alert all doctors"
    >
      <Siren size={22} />
      <span>SOS</span>
    </button>
  )
}

function EmergencyModal({ onClose }) {
  const [form, setForm] = useState({ symptoms: '', severity: 'HIGH', location: '' })
  const [saving, setSaving] = useState(false)
  const [submittedAlert, setSubmittedAlert] = useState(null)
  const [alertMsg, setAlertMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.symptoms.trim()) { setAlertMsg({ type:'warning', msg:'Please describe your symptoms.' }); return }
    setSaving(true); setAlertMsg(null)
    try {
      const result = await apiRaiseEmergency(form)
      setSubmittedAlert(result)
    } catch (err) {
      setAlertMsg({ type:'error', msg: err.message || 'Failed to raise emergency.' })
    } finally { setSaving(false) }
  }

  async function handleCancel() {
    if (!submittedAlert) { onClose(); return }
    try { await apiCancelEmergency(submittedAlert.id) } catch (_) {}
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && !submittedAlert && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, boxShadow:'0 32px 80px rgba(0,0,0,0.4)', overflow:'hidden', animation:'fadeInUp 0.25s ease' }}>
        {/* Red header */}
        <div style={{ background:'linear-gradient(135deg,#dc2626,#991b1b)', padding:'22px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:'2rem', animation:'pulse 1s infinite' }}>🚨</div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'#fff' }}>Emergency SOS</div>
              <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.7)' }}>Alert will be sent to all available doctors</div>
            </div>
          </div>
          {!submittedAlert && <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 10px', color:'#fff', cursor:'pointer' }}><X size={16} /></button>}
        </div>

        <div style={{ padding:'22px 24px' }}>
          {!submittedAlert ? (
            <form onSubmit={handleSubmit}>
              {alertMsg && (
                <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:14, fontSize:'0.85rem',
                  background: alertMsg.type==='warning'?'#fefce8':'#fef2f2',
                  color: alertMsg.type==='warning'?'#854d0e':'#991b1b',
                  border:`1px solid ${alertMsg.type==='warning'?'#fde047':'#fecaca'}`
                }}>{alertMsg.msg}</div>
              )}
              <div className="form-group">
                <label className="form-label">Describe Your Emergency / Symptoms *</label>
                <textarea className="form-input" rows={5} style={{ resize:'vertical', border:'1.5px solid #fca5a5', background:'#fff', color:'#111' }}
                  placeholder="e.g. Severe chest pain, difficulty breathing, dizzy since 10 minutes..."
                  value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Severity</label>
                  <select className="form-input" style={{ border:'1.5px solid #fca5a5', background:'#fff', color:'#111' }}
                    value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    <option value="CRITICAL">🔴 Critical — Life threatening</option>
                    <option value="HIGH">🟠 High — Urgent</option>
                    <option value="MEDIUM">🔵 Medium — Needs attention</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Location (optional)</label>
                  <input className="form-input" style={{ border:'1.5px solid #fca5a5', background:'#fff', color:'#111' }}
                    placeholder="e.g. Home, Chennai" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={saving} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#dc2626,#991b1b)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {saving ? <><span className="btn-spinner" /> Sending Alert…</> : <><Siren size={16} /> Send Emergency Alert</>}
                </button>
                <button type="button" onClick={onClose} style={{ padding:'12px 18px', background:'#f3f4f6', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer', color:'#374151' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
              <div style={{ fontSize:'3rem', marginBottom:12 }}>📡</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#166534', marginBottom:8 }}>Alert Sent to All Doctors!</div>
              <div style={{ fontSize:'0.85rem', color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>Your emergency alert has been broadcast. A doctor will accept and contact you shortly. Please stay calm.</div>
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'12px 16px', marginBottom:20, textAlign:'left' }}>
                <div style={{ fontSize:'0.78rem', color:'#166534', fontWeight:700, marginBottom:4 }}>Alert ID: {submittedAlert.id} · {submittedAlert.severity}</div>
                <div style={{ fontSize:'0.82rem', color:'#374151' }}>{submittedAlert.symptoms}</div>
              </div>
              <button onClick={handleCancel} style={{ padding:'10px 28px', background:'#f3f4f6', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer', color:'#374151' }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* -- Health Feed section ────────────────── */
const FEED_CATEGORIES = ['ALL','GENERAL_HEALTH','NUTRITION','MENTAL_HEALTH','CARDIOLOGY','DIABETES','FITNESS','COVID','PEDIATRICS','OTHER']

function HealthFeedSection() {
  const [articles, setArticles] = useState([])
  const [category, setCategory] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [reading, setReading] = useState(null)
  const [liked, setLiked] = useState(new Set())

  const load = useCallback(async () => {
    setLoading(true); setAlert(null)
    try {
      const data = await apiGetArticles(category === 'ALL' ? '' : category)
      setArticles(data || [])
    } catch (err) { setAlert({ type:'error', msg: err.message }) }
    finally { setLoading(false) }
  }, [category])

  useEffect(() => { load() }, [load])

  async function handleLike(id, e) {
    e.stopPropagation()
    if (liked.has(id)) return
    try {
      const updated = await apiLikeArticle(id)
      setArticles(prev => prev.map(a => a.id === id ? updated : a))
      setLiked(prev => new Set([...prev, id]))
    } catch (_) {}
  }

  const catLabel = c => c.replace(/_/g,' ')
  const fmtDate2 = val => {
    if (!val) return ''
    const d = Array.isArray(val) ? new Date(val[0],val[1]-1,val[2]) : new Date(val)
    return d.toLocaleDateString('en-IN', { dateStyle: 'medium' })
  }

  if (reading) {
    return (
      <div className="view-section">
        <button className="btn btn-outline btn-sm" style={{ width:'auto', marginBottom:20 }} onClick={() => setReading(null)}>
          ← Back to Health Feed
        </button>
        {reading.coverImageBase64 && (
          <img src={reading.coverImageBase64} alt="cover" style={{ width:'100%', maxHeight:300, objectFit:'cover', borderRadius:16, marginBottom:20 }} />
        )}
        <div className="card">
          <div className="card-body">
            <span style={{ background:'rgba(37,99,235,0.1)', color:'var(--clr-primary-700)', borderRadius:20, padding:'3px 12px', fontSize:'0.72rem', fontWeight:700 }}>{catLabel(reading.category)}</span>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.7rem', fontWeight:900, color:'var(--clr-neutral-900)', lineHeight:1.3, margin:'14px 0 8px' }}>{reading.title}</h1>
            <div style={{ fontSize:'0.82rem', color:'#6b7280', marginBottom:28, display:'flex', alignItems:'center', gap:8 }}>
              <span>✍️ Dr. {reading.doctor?.username}</span>
              <span>·</span>
              <span>{fmtDate2(reading.publishedAt)}</span>
              <span>·</span>
              <span>❤️ {reading.likesCount||0} likes</span>
            </div>
            <div style={{ fontSize:'0.97rem', lineHeight:1.9, color:'var(--clr-neutral-800)', whiteSpace:'pre-wrap' }}>{reading.content}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">📰 Health Feed</h2>
          <p className="page-header-sub">Health articles and awareness posts from our doctors. Stay informed, stay healthy.</p>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
        {FEED_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${category===c?'#2563eb':'#e5e7eb'}`,
              background: category===c?'linear-gradient(135deg,#2563eb,#1d4ed8)':'#fff',
              color: category===c?'#fff':'var(--clr-neutral-600)',
              fontWeight: category===c?700:500, fontSize:'0.78rem', cursor:'pointer', transition:'all 0.15s',
            }}>
            {c==='ALL'?'All Topics':catLabel(c)}
          </button>
        ))}
      </div>

      {alert && (
        <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:18, fontSize:'0.86rem', background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', cursor:'pointer' }} onClick={() => setAlert(null)}>{alert.msg}</div>
      )}

      {loading
        ? <div className="page-spinner"><span className="spinner" /> Loading articles…</div>
        : articles.length === 0
          ? <div className="card"><div className="card-body"><div className="empty-state">
              <div className="empty-icon">📰</div>
              <div className="empty-title">No articles yet</div>
              <div className="empty-text">Doctors haven't published any articles in this category yet. Check back soon!</div>
            </div></div></div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
              {articles.map(art => (
                <div key={art.id}
                  onClick={() => setReading(art)}
                  style={{ background:'#fff', borderRadius:16, overflow:'hidden', border:'1.5px solid var(--clr-neutral-200)', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  {art.coverImageBase64
                    ? <img src={art.coverImageBase64} alt="cover" style={{ width:'100%', height:160, objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:100, background:`linear-gradient(135deg,#1e3a5f,#2563eb)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>🏥</div>
                  }
                  <div style={{ padding:'16px' }}>
                    <span style={{ background:'rgba(37,99,235,0.1)', color:'#1d4ed8', borderRadius:20, padding:'2px 10px', fontSize:'0.68rem', fontWeight:700 }}>{catLabel(art.category)}</span>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.98rem', color:'var(--clr-neutral-900)', margin:'8px 0 6px', lineHeight:1.3 }}>{art.title}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--clr-neutral-500)', marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.5 }}>{art.content}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>Dr. {art.doctor?.username} · {fmtDate2(art.publishedAt)}</div>
                      <button
                        onClick={e => handleLike(art.id, e)}
                        style={{ background: liked.has(art.id)?'rgba(239,68,68,0.1)':'transparent', border:'none', cursor: liked.has(art.id)?'default':'pointer', display:'flex', alignItems:'center', gap:4, color: liked.has(art.id)?'#ef4444':'#9ca3af', fontSize:'0.78rem', padding:'4px 8px', borderRadius:20, transition:'all 0.15s' }}
                      >
                        <Heart size={13} fill={liked.has(art.id)?'#ef4444':'none'} /> {art.likesCount||0}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}

/* -- PatientDash (main export) -------------- */
export default function PatientDash() {
  const navigate = useNavigate()
  const username = getUsername()
  const token = getToken()
  const [view, setView] = useState('find')
  const [showSOS, setShowSOS] = useState(false)
  const [activeSessionAlert, setActiveSessionAlert] = useState(null)

  // Global listener for session start notifications across all tabs/pages
  useEffect(() => {
    if (!username || !token) return

    const checkActiveSessions = async () => {
      try {
        const appts = await apiGetMyAppointments()
        const accepted = (appts || []).filter(a => a.status === 'ACCEPTED')
        let activeFound = null
        if (accepted.length > 0) {
          const results = await Promise.allSettled(accepted.map(a => apiGetSessionStatus(a.id)))
          for (let i = 0; i < accepted.length; i++) {
            if (results[i].status === 'fulfilled') {
              const res = results[i].value
              if (res?.active && res?.roomId) {
                activeFound = {
                  doctorName: accepted[i].doctor?.username || 'your doctor',
                  roomId: res.roomId,
                  appointmentId: accepted[i].id,
                }
                break
              }
            }
          }
        }
        setActiveSessionAlert(activeFound)
      } catch { /* ignore */ }
    }

    checkActiveSessions()
    const interval = setInterval(checkActiveSessions, 4000)

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8100/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        const handler = (frame) => {
          try {
            const data = JSON.parse(frame.body)
            if (data.type === 'SESSION_STARTED' && data.roomId) {
              setActiveSessionAlert({
                doctorName: data.doctorName,
                roomId: data.roomId,
                appointmentId: data.appointmentId,
              })
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('👨‍⚕️ Session Started!', {
                  body: `Dr. ${data.doctorName} has started your consultation session and is waiting for you.`,
                  icon: '/favicon.ico',
                })
              }
            }
            if (data.type === 'SESSION_ENDED') {
              setActiveSessionAlert(null)
            }
          } catch { /* ignore */ }
        }
        client.subscribe(`/topic/patient-notifications/${username}`, handler)
        client.subscribe('/topic/patient-notifications', handler)
      },
    })
    client.activate()

    return () => {
      clearInterval(interval)
      client.deactivate()
    }
  }, [username, token])

  const navItems = [
    { id: 'find',          label: 'Find a Doctor',        icon: <Search size={16} /> },
    { id: 'myappts',       label: 'My Appointments',      icon: <ClipboardList size={16} /> },
    { id: 'prescriptions', label: 'My Prescriptions',     icon: <Pill size={16} /> },
    { id: 'vitals',        label: 'Health Vitals & EHR',  icon: <Activity size={16} /> },
    { id: 'labtests',      label: 'Diagnostics & Labs',   icon: <FlaskConical size={16} /> },
    { id: 'hospital',      label: 'Hospital Facilities',  icon: <Building2 size={16} /> },
    { id: 'feed',          label: 'Health Feed',          icon: <Newspaper size={16} /> },
    { id: 'mydocs',        label: 'My Documents',         icon: <FileText size={16} /> },
  ]

  const titles = {
    find: 'Find a Doctor',
    myappts: 'My Appointments',
    prescriptions: 'My Prescriptions',
    vitals: 'Health Vitals & Longitudinal EHR',
    labtests: 'Diagnostic Lab Tests & Biomarker Reports',
    hospital: 'Hospital Facilities & Live Bed Tracker',
    feed: 'Health Feed',
    mydocs: 'My Documents',
    profile: 'My Profile',
  }

  return (
    <DashLayout role="PATIENT" activeView={view} setActiveView={setView} navItems={navItems} topbarTitle={titles[view]}>
      {/* Emergency SOS floating button — always visible */}
      <EmergencySOSButton onOpen={() => setShowSOS(true)} />
      {showSOS && <EmergencyModal onClose={() => setShowSOS(false)} />}

      {/* Persistent Bottom-Left Session Notification Callout on Landing Page & All Views */}
      {activeSessionAlert && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 99999,
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 60%, #059669 100%)',
          color: '#ffffff',
          padding: '16px 20px',
          borderRadius: 16,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          maxWidth: 440,
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0
          }}>
            👨‍⚕️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Dr. {activeSessionAlert.doctorName} has started your consultation!
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.95, marginTop: 2 }}>
              Doctor is waiting in the room for you.
            </div>
          </div>
          <button
            className="btn"
            style={{
              background: '#ffffff', color: '#15803d', fontWeight: 800, fontSize: '0.82rem',
              padding: '10px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
            onClick={() => navigate(`/session/${activeSessionAlert.roomId}`)}
          >
            <Video size={15} /> Join Consultation Now
          </button>
        </div>
      )}

      {view === 'find'          && <FindSection />}
      {view === 'myappts'       && <MyApptsSection />}
      {view === 'prescriptions' && <PrescriptionsSection />}
      {view === 'vitals'        && <VitalsAndEHRSection />}
      {view === 'labtests'      && <DiagnosticsLabSection />}
      {view === 'hospital'      && <HospitalFacilitiesSection />}
      {view === 'feed'          && <HealthFeedSection />}
      {view === 'mydocs'        && <MyDocsSection />}
      {view === 'profile'       && <ProfileSection />}
    </DashLayout>
  )
}
