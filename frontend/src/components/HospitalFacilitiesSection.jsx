import React, { useState, useEffect, useCallback } from 'react'
import {
  Building2, Bed, Ambulance, Phone, ShieldCheck, AlertCircle,
  Clock, CheckCircle2, Navigation, ArrowRight, Gauge, Check, X
} from 'lucide-react'
import { apiGetHospitalBeds, apiGetAmbulanceStatus, apiBookHospitalBed, apiGetMyBedRequests } from '../api'

export default function HospitalFacilitiesSection() {
  const [activeSubTab, setActiveSubTab] = useState('BEDS') // 'BEDS' | 'AMBULANCE'
  const [bedData, setBedData] = useState(null)
  const [ambulanceData, setAmbulanceData] = useState(null)
  const [selectedWard, setSelectedWard] = useState(null)
  const [showAdmissionModal, setShowAdmissionModal] = useState(false)
  const [admissionForm, setAdmissionForm] = useState({
    wardCode: 'ICU',
    wardName: 'Intensive Care Unit (ICU)',
    bedNo: '',
    patientName: '',
    contactPhone: '',
    urgency: 'HIGH',
    notes: ''
  })
  const [admissionSuccess, setAdmissionSuccess] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [beds, amb, reqs] = await Promise.all([
        apiGetHospitalBeds().catch(() => null),
        apiGetAmbulanceStatus().catch(() => null),
        apiGetMyBedRequests().catch(() => [])
      ])
      setBedData(beds)
      setAmbulanceData(amb)
      setMyRequests(reqs || [])
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
      setAlert({ type: 'error', msg: err.message || 'Failed to load facility data.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAdmissionSubmit(e) {
    e.preventDefault()
    setAdmissionSuccess(true)
    try {
      const res = await apiBookHospitalBed({
        wardCode: admissionForm.wardCode || (selectedWard?.code || 'ICU'),
        wardName: admissionForm.wardName || (selectedWard?.wardName || 'General Ward'),
        bedNo: admissionForm.bedNo || 'Any Available',
        patientName: admissionForm.patientName,
        contactPhone: admissionForm.contactPhone,
        urgency: admissionForm.urgency,
        notes: admissionForm.notes
      })
      setAlert({ type: 'success', msg: `✅ Bed booking request #${res?.id || ''} sent to Hospital Admin for approval! The Admin will review and allocate your bed.` })
      setShowAdmissionModal(false)
      loadData()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to submit bed booking request.' })
    } finally {
      setAdmissionSuccess(false)
    }
  }

  function handleSelectBed(b) {
    if (b.status === 'AVAILABLE') {
      setAdmissionForm(f => ({
        ...f,
        wardCode: selectedWard?.code,
        wardName: selectedWard?.wardName,
        bedNo: b.bedNo
      }))
      setShowAdmissionModal(true)
    }
  }

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Hospital Facilities & Emergency Operations</h2>
          <p className="page-header-sub">Live monitoring of inpatient ward beds, critical care units, and emergency ambulance dispatch.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'BEDS' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('BEDS')}
          >
            <Building2 size={14} /> Inpatient Beds & Wards ({bedData?.availableBeds || 0} Free)
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'AMBULANCE' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('AMBULANCE')}
          >
            <Ambulance size={14} /> Live Ambulance Dispatch Tracker
          </button>
        </div>
      </div>

      {alert && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontSize: '0.86rem',
          background: alert.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alert.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${alert.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          cursor: 'pointer'
        }} onClick={() => setAlert(null)}>
          {alert.msg}
        </div>
      )}

      {loading ? (
        <div className="page-spinner"><span className="spinner" /> Loading hospital facilities telemetry…</div>
      ) : activeSubTab === 'BEDS' ? (
        <div>
          {/* Top Occupancy Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
            <div className="card" style={{ padding: 18, borderRadius: 14, background: 'linear-gradient(145deg, #ffffff, #eff6ff)', border: '1.5px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>Total Capacity</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', marginTop: 6 }}>
                {bedData?.totalBeds || 150} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Beds</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Across 6 Specialist Wards</div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, background: 'linear-gradient(145deg, #ffffff, #f0fdf4)', border: '1.5px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Available Now</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#16a34a', marginTop: 6 }}>
                {bedData?.availableBeds || 40} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Beds Free</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: 4 }}>✓ Ready for Admission</div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, background: 'linear-gradient(145deg, #ffffff, #fef2f2)', border: '1.5px solid #fecaca' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Currently Occupied</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#dc2626', marginTop: 6 }}>
                {bedData?.occupiedBeds || 110} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Patients</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#991b1b', marginTop: 4 }}>Under Active Clinical Care</div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, background: 'linear-gradient(145deg, #ffffff, #faf5ff)', border: '1.5px solid #e9d5ff' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>Occupancy Rate</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#7c3aed', marginTop: 6 }}>
                {bedData?.occupancyRate || 73}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: 600, marginTop: 4 }}>Normal Hospital Load</div>
            </div>
          </div>

          {/* Ward Selection and Bed Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Left: Ward List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 2 }}>
                Specialized Inpatient Units
              </div>
              {(bedData?.wards || []).map(w => {
                const isSelected = selectedWard?.code === w.code
                return (
                  <div
                    key={w.code}
                    onClick={() => setSelectedWard(w)}
                    style={{
                      padding: 14, borderRadius: 12, cursor: 'pointer',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.94rem', color: isSelected ? '#1e40af' : '#0f172a' }}>
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

              <button
                className="btn btn-primary"
                onClick={() => setShowAdmissionModal(true)}
                style={{ marginTop: 10, padding: 12, fontWeight: 800 }}
              >
                + Request Bed / Inpatient Admission
              </button>
            </div>

            {/* Right: Selected Ward Bed Layout */}
            {selectedWard && (
              <div className="card" style={{ padding: 22, borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 18 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      🏥 {selectedWard.wardName}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Floor: {selectedWard.floor} · Nurse-Patient Ratio: {selectedWard.nurseRatio}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Ventilators Available:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{selectedWard.ventilatorsAvailable} Units</div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 18, marginBottom: 18, fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: '#10b981' }} />
                    <span style={{ fontWeight: 600 }}>Available ({selectedWard.available})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: '#ef4444' }} />
                    <span style={{ fontWeight: 600 }}>Occupied ({selectedWard.occupied})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: '#f59e0b' }} />
                    <span style={{ fontWeight: 600 }}>Sanitizing / Prep</span>
                  </div>
                </div>

                {/* Bed Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                  {(selectedWard.beds || []).map(b => {
                    const isAvailable = b.status === 'AVAILABLE'
                    const isOccupied = b.status === 'OCCUPIED'
                    return (
                      <div
                        key={b.bedNo}
                        onClick={() => handleSelectBed(b)}
                        style={{
                          padding: 12, borderRadius: 10, textAlign: 'center',
                          border: `1.5px solid ${isAvailable ? '#86efac' : isOccupied ? '#fca5a5' : '#fde68a'}`,
                          background: isAvailable ? '#f0fdf4' : isOccupied ? '#fef2f2' : '#fffbeb',
                          cursor: isAvailable ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          boxShadow: isAvailable ? '0 2px 6px rgba(16,185,129,0.1)' : 'none'
                        }}
                        title={isAvailable ? `Click to request bed ${b.bedNo}` : `${b.bedNo} (${b.status})`}
                      >
                        <div style={{ fontSize: '1.4rem' }}>🛏️</div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginTop: 4 }}>
                          {b.bedNo}
                        </div>
                        <div style={{
                          fontSize: '0.7rem', fontWeight: 800, marginTop: 4,
                          color: isAvailable ? '#166534' : isOccupied ? '#991b1b' : '#92400e'
                        }}>
                          {b.status}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                          {b.patientCode}
                        </div>
                        {isAvailable && (
                          <div style={{ marginTop: 6, fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 4px', borderRadius: 4 }}>
                            + Book Bed
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Patient's Bed Booking Requests Status */}
          <div className="card" style={{ marginTop: 24, padding: 20, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bed size={18} color="#0284c7" /> My Hospital Bed Requests (Admin Status Tracker)
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                All requests are reviewed & confirmed by the Hospital Admin
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem', background: '#f8fafc', borderRadius: 10 }}>
                You have not requested any hospital beds yet. Click <strong>+ Request Bed</strong> above or click an available bed to submit a booking request to the Admin.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: 10 }}>Req #</th>
                      <th style={{ padding: 10 }}>Ward Unit</th>
                      <th style={{ padding: 10 }}>Requested Bed</th>
                      <th style={{ padding: 10 }}>Urgency</th>
                      <th style={{ padding: 10 }}>Requested At</th>
                      <th style={{ padding: 10 }}>Admin Status</th>
                      <th style={{ padding: 10 }}>Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 10, fontWeight: 700 }}>#{r.id}</td>
                        <td style={{ padding: 10, fontWeight: 600 }}>{r.wardName || r.wardCode}</td>
                        <td style={{ padding: 10 }}>{r.bedNo || 'Any Free Bed'}</td>
                        <td style={{ padding: 10 }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12,
                            background: r.urgency === 'CRITICAL' ? '#fee2e2' : r.urgency === 'HIGH' ? '#fef3c7' : '#e0f2fe',
                            color: r.urgency === 'CRITICAL' ? '#991b1b' : r.urgency === 'HIGH' ? '#92400e' : '#0369a1'
                          }}>
                            {r.urgency || 'HIGH'}
                          </span>
                        </td>
                        <td style={{ padding: 10, color: '#64748b' }}>
                          {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : 'Recent'}
                        </td>
                        <td style={{ padding: 10 }}>
                          {r.status === 'PENDING' && (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ⏳ Pending Admin Approval
                            </span>
                          )}
                          {r.status === 'ACCEPTED' && (
                            <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ✅ Bed Allocated ({r.bedNo})
                            </span>
                          )}
                          {r.status === 'REJECTED' && (
                            <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ❌ Request Declined
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 10, color: '#475569', fontSize: '0.8rem' }}>
                          {r.adminNotes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Live Ambulance Dispatch Tracker */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Left: Live Route Map Simulation */}
          <div className="card" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ambulance size={20} color="#dc2626" /> Advanced Life Support (ALS) Unit: {ambulanceData?.ambulanceId}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  Model: {ambulanceData?.vehicleModel} · Dispatch Base: {ambulanceData?.hospitalBase}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', padding: '4px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 900 }}>
                  🚨 EN ROUTE (ETA: {ambulanceData?.etaMinutes} MINS)
                </span>
              </div>
            </div>

            {/* Simulated Live GPS Map Graphic */}
            <div style={{
              width: '100%', height: 260, borderRadius: 12, background: '#1e293b',
              position: 'relative', overflow: 'hidden', border: '1px solid #334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {/* Map grid lines */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }} />

              {/* Pulsing ambulance marker */}
              <div style={{
                position: 'absolute', top: '40%', left: '45%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                animation: 'pulse 1.8s infinite'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.3)',
                  border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  🚑
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, marginTop: 4 }}>
                  Speed: {ambulanceData?.currentSpeed} · Heading {ambulanceData?.liveGps?.heading}
                </div>
              </div>

              {/* Patient Location Destination */}
              <div style={{ position: 'absolute', bottom: '20%', right: '15%', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem' }}>📍</div>
                <div style={{ background: '#059669', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                  Patient Location
                </div>
              </div>
            </div>

            {/* Onboard Emergency Life Support Equipment */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                Equipped Advanced Medical Life Support Systems:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(ambulanceData?.equipmentOnboard || []).map((eq, i) => (
                  <span key={i} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: 6, fontSize: '0.76rem', fontWeight: 600, color: '#1e293b' }}>
                    ✓ {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Driver Info & Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PARAMEDIC & DRIVER</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: 4 }}>
                {ambulanceData?.driverName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                📞 Emergency Phone: <strong style={{ color: '#0f172a' }}>{ambulanceData?.driverPhone}</strong>
              </div>
              <a
                href={`tel:${ambulanceData?.driverPhone}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginTop: 12, padding: '8px 0', background: '#16a34a', color: '#fff',
                  borderRadius: 8, fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none'
                }}
              >
                <Phone size={14} /> Call Paramedic Directly
              </a>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, flex: 1 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
                DISPATCH MILESTONES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(ambulanceData?.timeline || []).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: step.done ? '#16a34a' : step.current ? '#ef4444' : '#e2e8f0',
                      color: '#fff', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2
                    }}>
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: step.current ? '#ef4444' : '#0f172a' }}>
                        {step.step}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {step.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bed Admission Modal */}
      {showAdmissionModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.2s ease-out' }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} color="#60a5fa" /> Inpatient Bed Admission Enquiry
              </div>
              <button onClick={() => setShowAdmissionModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAdmissionSubmit} style={{ padding: 22 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Preferred Ward Unit</label>
                <select
                  className="form-input"
                  value={admissionForm.wardCode || (selectedWard?.code || 'ICU')}
                  onChange={e => {
                    const code = e.target.value
                    const found = (bedData?.wards || []).find(w => w.code === code)
                    setAdmissionForm(f => ({
                      ...f,
                      wardCode: code,
                      wardName: found?.wardName || code,
                      bedNo: ''
                    }))
                  }}
                >
                  {(bedData?.wards || []).map(w => (
                    <option key={w.code} value={w.code}>
                      {w.wardName} ({w.available} Free Beds)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Preferred Bed Number</label>
                <input
                  className="form-input"
                  placeholder="e.g. STE-501 or leave blank for next available"
                  value={admissionForm.bedNo}
                  onChange={e => setAdmissionForm(f => ({ ...f, bedNo: e.target.value }))}
                />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Patient Full Name</label>
                  <input
                    className="form-input"
                    placeholder="Patient name"
                    value={admissionForm.patientName}
                    onChange={e => setAdmissionForm(f => ({ ...f, patientName: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Primary Contact Phone</label>
                  <input
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={admissionForm.contactPhone}
                    onChange={e => setAdmissionForm(f => ({ ...f, contactPhone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Admission Urgency Level</label>
                <select
                  className="form-input"
                  value={admissionForm.urgency}
                  onChange={e => setAdmissionForm(f => ({ ...f, urgency: e.target.value }))}
                >
                  <option value="NORMAL">Normal / Planned Admission</option>
                  <option value="HIGH">High Priority (Urgent)</option>
                  <option value="CRITICAL">Critical Emergency (Immediate)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Reason for Admission / Symptoms</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Briefly state symptoms, doctor recommendation, or special care requirements..."
                  value={admissionForm.notes}
                  onChange={e => setAdmissionForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdmissionModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={admissionSuccess} className="btn btn-primary" style={{ flex: 2, fontWeight: 800 }}>
                  {admissionSuccess ? 'Submitting to Admin…' : 'Send Bed Request to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
