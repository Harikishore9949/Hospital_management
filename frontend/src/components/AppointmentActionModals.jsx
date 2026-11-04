import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, X, CheckCircle2 } from 'lucide-react'
import { apiCancelAppointment, apiRescheduleAppointment, apiGetDoctorSlots, fmtDate, fmtTime } from '../api'

export function CancelAppointmentModal({ appointment, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!appointment) return null

  async function handleCancel(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiCancelAppointment(appointment.id, reason)
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
        background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeInUp 0.2s ease-out'
      }}>
        <div style={{ padding: '18px 22px', background: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#dc2626" /> Cancel Appointment #{appointment.id}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#991b1b', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleCancel} style={{ padding: 22 }}>
          <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 14px 0' }}>
            Are you sure you want to cancel your consultation with <strong>Dr. {appointment.doctor?.username}</strong>?
            The booked slot will be released back to the doctor's calendar.
          </p>

          {appointment.paymentStatus === 'PAID' ? (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#065f46', padding: '12px 14px', borderRadius: 10, fontSize: '0.82rem', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 2 }}>💰 Full Refund Guaranteed</div>
              <div>Since you have paid the consultation fee of <strong>₹{appointment.consultationFee || 500}</strong>, a 100% full refund will be automatically processed back to your original payment method.</div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 12px', borderRadius: 8, fontSize: '0.80rem', marginBottom: 14 }}>
              ℹ️ You have not paid yet. Cancelling will release the slot without any payment or refund.
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', color: '#334155' }}>Reason for Cancellation (Optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Schedule conflict, feeling better, need to reschedule..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-danger"
              style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700 }}
            >
              {loading ? 'Cancelling…' : 'Yes, Cancel Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function RescheduleAppointmentModal({ appointment, onClose, onSuccess }) {
  const [slots, setSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const doctorId = appointment?.doctor?.id
  const doctorName = appointment?.doctor?.username || 'Doctor'

  useEffect(() => {
    if (!doctorId) return
    setLoadingSlots(true)
    apiGetDoctorSlots(doctorId)
      .then(data => {
        // filter available slots and ignore current slot
        const available = (Array.isArray(data) ? data : []).filter(s => s.available && s.id !== appointment.availabilitySlot?.id)
        setSlots(available)
      })
      .catch(e => setError(e.message || 'Failed to load available slots.'))
      .finally(() => setLoadingSlots(false))
  }, [doctorId, appointment])

  async function handleReschedule(e) {
    e.preventDefault()
    if (!selectedSlotId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiRescheduleAppointment(appointment.id, selectedSlotId)
      onSuccess?.(res)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to reschedule.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 520,
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeInUp 0.2s ease-out'
      }}>
        <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#60a5fa" /> Reschedule Appointment #{appointment.id}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleReschedule} style={{ padding: 22 }}>
          <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: 14 }}>
            Choose a new consultation slot with <strong>Dr. {doctorName}</strong>. Your current slot will be automatically released.
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: 20 }}>
            {loadingSlots ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Loading doctor's open slots…
              </div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>No other open slots available</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                  Dr. {doctorName} currently has no other available appointment openings.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {slots.map(s => {
                  const isSelected = selectedSlotId === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSlotId(s.id)}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        boxShadow: isSelected ? '0 3px 10px rgba(37,99,235,0.15)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? '#1e40af' : '#0f172a' }}>
                        📅 {fmtDate(s.date)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: isSelected ? '#2563eb' : '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlotId}
              className="btn btn-primary"
              style={{ flex: 2, fontWeight: 700 }}
            >
              {submitting ? 'Confirming Reschedule…' : 'Confirm New Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
