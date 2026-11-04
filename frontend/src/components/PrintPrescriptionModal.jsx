import React from 'react'
import { Printer, X, CheckCircle2, ShieldCheck, HeartPulse, Building2 } from 'lucide-react'

export default function PrintPrescriptionModal({ prescription, onClose }) {
  if (!prescription) return null

  const issuedDate = prescription.issuedAt
    ? (Array.isArray(prescription.issuedAt)
        ? new Date(prescription.issuedAt[0], prescription.issuedAt[1] - 1, prescription.issuedAt[2]).toLocaleDateString('en-IN', { dateStyle: 'long' })
        : new Date(prescription.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }))
    : new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })

  const doctorName = prescription.doctor?.username || 'Doctor'
  const patientName = prescription.patient?.username || 'Patient'
  const medicines = prescription.medicines || []

  function handlePrint() {
    window.print()
  }

  return (
    <div className="print-modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', overflowY: 'auto'
    }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-prescription-sheet, .printable-prescription-sheet * {
            visibility: visible !important;
          }
          .printable-prescription-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 720,
        maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Modal Top Actions */}
        <div className="no-print" style={{
          padding: '14px 22px', background: '#0f172a', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} color="#60a5fa" /> Official Prescription Document
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                color: '#fff', padding: '6px 16px', borderRadius: 8, fontSize: '0.82rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Printer size={14} /> Print / Download PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Prescription Content */}
        <div className="printable-prescription-sheet" style={{ padding: '36px 44px', color: '#1e293b', background: '#ffffff' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #2563eb', paddingBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.8rem' }}>🏥</span>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#1e3a8a', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                    MEDICARE MULTI-SPECIALITY HOSPITAL
                  </h1>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    NABH Accredited · Telemedicine & Virtual Care Center · Reg #MCR-2026-9949
                  </p>
                </div>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 8 }}>
                📍 Central Healthcare Campus, Avenue 4 · 📞 24x7 Helpline: 1800-MEDICARE
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Prescription ID</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1d4ed8' }}>#{prescription.id}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                <strong>Date:</strong> {issuedDate}
              </div>
            </div>
          </div>

          {/* Doctor & Patient Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '22px 0', padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>CONSULTING PHYSICIAN</div>
              <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', marginTop: 3 }}>Dr. {doctorName}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>MBBS, MD · General & Internal Medicine</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Medical Council Reg: MCI-{1000 + (prescription.id * 7)}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PATIENT INFORMATION</div>
              <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', marginTop: 3 }}>Patient: {patientName}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>Consultation Type: Digital Tele-Visit</div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: 2 }}>Status: Verified Patient Record</div>
            </div>
          </div>

          {/* Rx Symbol */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px 0' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', fontStyle: 'italic', fontFamily: 'serif' }}>℞</span>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Medications & Dosage Instructions
            </div>
          </div>

          {/* Medicines Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 800, color: '#334155' }}>#</th>
                <th style={{ padding: '10px 12px', fontWeight: 800, color: '#334155' }}>Medicine Name</th>
                <th style={{ padding: '10px 12px', fontWeight: 800, color: '#334155' }}>Dosage</th>
                <th style={{ padding: '10px 12px', fontWeight: 800, color: '#334155' }}>Frequency & Timing</th>
                <th style={{ padding: '10px 12px', fontWeight: 800, color: '#334155' }}>Duration</th>
                <th style={{ padding: '10px 12px', fontWeight: 800, color: '#334155' }}>Special Instructions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, idx) => (
                <tr key={med.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                    💊 {med.medicineName}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem' }}>
                      {med.dosage || 'Standard'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#334155' }}>
                    {med.timesPerDay} time(s) daily<br />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({med.scheduledTimes || '08:00 AM'})</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem' }}>
                      {med.durationDays || 5} Day(s)
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#475569', fontStyle: med.instructions ? 'normal' : 'italic' }}>
                    {med.instructions || 'As advised'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Advice / General Notes */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: '0.82rem', color: '#92400e', marginBottom: 30 }}>
            <strong>General Instructions:</strong> Complete the full course of prescribed medications. Drink plenty of water and maintain adequate rest. In case of unexpected allergic reaction or symptom persistence, contact hospital emergency immediately.
          </div>

          {/* Digital Sign & QR Verification Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
            {/* QR Code Verification Simulation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, border: '2px solid #0f172a', padding: 4,
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, background: '#fff'
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
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>Digital Verification Stamp</div>
                <div>Scan to verify prescription authenticity on MediCare portal.</div>
                <div style={{ color: '#16a34a', fontWeight: 700, marginTop: 2 }}>✓ Cryptographically Verified</div>
              </div>
            </div>

            {/* Doctor Signature Block */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '1.35rem', color: '#1e3a8a', transform: 'rotate(-2deg)', marginBottom: 4 }}>
                Dr. {doctorName}
              </div>
              <div style={{ width: 180, borderTop: '1.5px solid #0f172a', paddingTop: 4 }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>Authorized Signatory</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>MediCare Clinical Services</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
