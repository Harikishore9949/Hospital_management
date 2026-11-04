import React, { useState } from 'react'
import { CreditCard, QrCode, CheckCircle2, ShieldCheck, X, Building, ArrowRight } from 'lucide-react'
import { apiPayAppointment } from '../api'

export default function AppointmentPaymentModal({ appointment, onClose, onSuccess }) {
  const [method, setMethod] = useState('UPI') // 'UPI' | 'CARD' | 'NETBANKING'
  const [upiId, setUpiId] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [selectedBank, setSelectedBank] = useState('HDFC')
  const [loading, setLoading] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)
  const [error, setError] = useState(null)

  const doctorName = appointment?.doctor?.username || 'Doctor'
  const fee = appointment?.consultationFee || 500

  async function handlePay(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const txId = 'TXN-' + Math.floor(100000000 + Math.random() * 900000000)
      const res = await apiPayAppointment(appointment.id, txId)
      setSuccessReceipt({
        id: appointment.id,
        txId,
        amount: fee,
        doctorName,
        paymentMethod: method,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      })
      onSuccess?.(res)
    } catch (err) {
      setError(err.message || 'Payment processing failed.')
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
        background: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 520,
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'fadeInUp 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#ffffff',
          padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#60a5fa" /> MediCare Secure Payment Gateway
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
              128-bit Encrypted Consultation Payment
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 22 }}>
          {successReceipt ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 6 }}>🎉</div>
              <h3 style={{ margin: 0, color: '#166534', fontWeight: 800, fontSize: '1.25rem' }}>
                Payment Successful!
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4, marginBottom: 18 }}>
                Your appointment consultation fee has been verified and confirmed.
              </p>

              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginBottom: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                  RECEIPT SUMMARY
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Transaction ID:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{successReceipt.txId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Consulting Doctor:</span>
                  <span style={{ fontWeight: 700 }}>Dr. {successReceipt.doctorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Paid Mode:</span>
                  <span style={{ fontWeight: 600 }}>{successReceipt.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Date & Time:</span>
                  <span>{successReceipt.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#2563eb', borderTop: '1px solid #cbd5e1', paddingTop: 8, marginTop: 8 }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{successReceipt.amount.toFixed(2)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '10px 0', fontWeight: 800 }}
              >
                Done & Return to Appointments
              </button>
            </div>
          ) : (
            <div>
              {/* Fee Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 700 }}>CONSULTATION BOOKING FEE</div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', marginTop: 2 }}>
                    Dr. {doctorName} (Online Video Slot)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2563eb' }}>₹{fee}</div>
                  <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>✓ Inclusive of GST</div>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Payment Method Selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: <QrCode size={15} /> },
                  { id: 'CARD', label: 'Credit / Debit Card', icon: <CreditCard size={15} /> },
                  { id: 'NETBANKING', label: 'Net Banking', icon: <Building size={15} /> },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    style={{
                      flex: 1, padding: '9px 6px', borderRadius: 10,
                      border: method === m.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: method === m.id ? '#eff6ff' : '#f8fafc',
                      color: method === m.id ? '#1d4ed8' : '#475569',
                      fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePay}>
                {method === 'UPI' && (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{
                      display: 'inline-block', padding: 12, border: '2px dashed #93c5fd',
                      borderRadius: 12, background: '#f8fafc', marginBottom: 12
                    }}>
                      <div style={{
                        width: 130, height: 130, margin: 'auto', background: '#ffffff',
                        border: '2px solid #0f172a', padding: 6, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3
                      }}>
                        <div style={{ background: '#000', gridColumn: 'span 2', gridRow: 'span 2' }}></div>
                        <div style={{ background: '#000' }}></div>
                        <div style={{ background: '#000', gridColumn: 'span 2', gridRow: 'span 2' }}></div>
                        <div style={{ background: '#000' }}></div>
                        <div style={{ background: '#000' }}></div>
                        <div style={{ background: '#000', gridColumn: 'span 2', gridRow: 'span 2' }}></div>
                        <div style={{ background: '#000' }}></div>
                        <div style={{ background: '#000' }}></div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>
                        Scan via GPay, PhonePe, or Paytm
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 8 }}>— or enter Virtual Payment Address (VPA) —</div>
                    <input
                      className="form-input"
                      placeholder="e.g. yourname@oksbi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      style={{ textAlign: 'center', fontSize: '0.88rem' }}
                    />
                  </div>
                )}

                {method === 'CARD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Card Number</label>
                      <input
                        className="form-input"
                        placeholder="4532 •••• •••• 8892"
                        maxLength={19}
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Valid Thru (MM/YY)</label>
                        <input
                          className="form-input"
                          placeholder="12/28"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>CVV</label>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'NETBANKING' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Select Bank</label>
                    <select
                      className="form-input"
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                    >
                      <option value="HDFC">HDFC Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="KOTAK">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', marginTop: 20, padding: '12px 0',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', color: '#fff', borderRadius: 10,
                    fontWeight: 800, fontSize: '0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {loading ? (
                    <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Authorizing Payment…</>
                  ) : (
                    <>Pay ₹{fee}.00 Now <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
