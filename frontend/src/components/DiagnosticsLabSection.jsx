import React, { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical, CheckCircle2, Clock, Calendar, ArrowRight,
  Printer, ShieldCheck, AlertCircle, FileText, Download, Building
} from 'lucide-react'
import { apiGetLabCatalog, apiBookLabTest, apiGetMyLabOrders, fmtDate } from '../api'
import PrintLabReportModal from './PrintLabReportModal'

export default function DiagnosticsLabSection() {
  const [catalog, setCatalog] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [activeTab, setActiveTab] = useState('CATALOG') // 'CATALOG' | 'MY_ORDERS'
  const [selectedTestToBook, setSelectedTestToBook] = useState(null)
  const [viewingReport, setViewingReport] = useState(null)
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    collectionType: 'HOME_COLLECTION',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '08:30 AM',
    address: ''
  })
  const [bookingLoading, setBookingLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [catData, ordersData] = await Promise.all([
        apiGetLabCatalog().catch(() => []),
        apiGetMyLabOrders().catch(() => [])
      ])
      setCatalog(Array.isArray(catData) ? catData : [])
      setMyOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to load diagnostic catalog.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewingReport(null)
        setSelectedTestToBook(null)
        setSelectedOrderForPrint(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleConfirmBooking(e) {
    e.preventDefault()
    if (!selectedTestToBook) return
    setBookingLoading(true)
    try {
      const payload = {
        testName: selectedTestToBook.name,
        testCategory: selectedTestToBook.category,
        price: selectedTestToBook.price,
        collectionType: bookingForm.collectionType,
        scheduledDate: bookingForm.scheduledDate,
        scheduledTime: bookingForm.scheduledTime,
        status: 'SAMPLE_PENDING' // Dispatched directly to Lab Center queue upon payment
      }
      const res = await apiBookLabTest(payload)
      setAlert({ type: 'success', msg: `🎉 Diagnostic test "${res.testName}" payment verified! Request sent to Lab Center for specimen collection & testing.` })
      setSelectedTestToBook(null)
      setActiveTab('MY_ORDERS')
      await loadData()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Failed to book test.' })
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="view-section">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Diagnostic Center & Lab Reports</h2>
          <p className="page-header-sub">Certified laboratory testing with home sample pickup and digital biomarker reports.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-sm ${activeTab === 'CATALOG' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('CATALOG')}
          >
            <FlaskConical size={14} /> Available Test Packages ({catalog.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'MY_ORDERS' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('MY_ORDERS')}
          >
            <FileText size={14} /> My Lab Orders & Reports ({myOrders.length})
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
        <div className="page-spinner"><span className="spinner" /> Loading laboratory tests…</div>
      ) : activeTab === 'CATALOG' ? (
        /* Test Catalog Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {catalog.map(test => (
            <div key={test.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, borderRadius: 14, border: '1.5px solid #e2e8f0', background: 'linear-gradient(145deg, #ffffff, #f8fafc)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>
                    {test.category}
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#166534' }}>
                    ₹{test.price}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>
                  🧪 {test.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  {test.description}
                </p>

                {test.equipmentUsed && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', color: '#166534', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔬</span>
                    <div><strong>Equipment:</strong> {test.equipmentUsed}</div>
                  </div>
                )}

                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', fontSize: '0.76rem', color: '#475569', marginBottom: 14 }}>
                  <div style={{ marginBottom: 4 }}>⏱️ <strong>Turnaround:</strong> {test.turnaround}</div>
                  <div style={{ marginBottom: 4 }}>🩸 <strong>Specimen:</strong> {test.sampleType || 'Whole Blood / Serum'}</div>
                  <div>ℹ️ <strong>Prep:</strong> {test.fasting}</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                    Key Biomarkers Tested:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(test.biomarkers || []).map((b, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', color: '#334155' }}>
                        • {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setSelectedTestToBook(test)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800 }}
              >
                Book Diagnostic Test <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* My Orders & Reports List */
        myOrders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>🧪</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>No Diagnostic Orders Yet</div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 400, margin: '6px auto 18px auto' }}>
              You haven't booked any lab tests yet. Browse our diagnostic catalog to order health checkups with home pickup.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('CATALOG')}>
              Browse Diagnostic Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myOrders.map(order => {
              const isCompleted = order.status === 'COMPLETED'
              return (
                <div key={order.id} className="card" style={{ padding: 18, borderRadius: 14, border: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>🔬</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                          {order.testName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                          Order #{order.id} {order.sampleAccessionNumber ? `· Barcode: ${order.sampleAccessionNumber}` : ''} · Category: {order.testCategory || 'General'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#0284c7', marginTop: 2, fontWeight: 600 }}>
                          📅 Scheduled: {order.scheduledDate ? fmtDate(order.scheduledDate) : 'Today'} ({order.scheduledTime || '08:30 AM'})
                          {order.scheduledSlotNotes && ` · ${order.scheduledSlotNotes}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: '0.76rem', flexWrap: 'wrap' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#475569', fontWeight: 600 }}>
                        {order.collectionType === 'HOME_COLLECTION' ? '🏠 Home Sample Collection' : '🏥 Hospital Walk-in'}
                      </span>
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        Paid ₹{order.price?.toFixed(2)} (TXN: {order.transactionId})
                      </span>
                      {order.estimatedResultTime && (
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          ⏱️ Results: {order.estimatedResultTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {order.status === 'SAMPLE_PENDING' && (
                      <span style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800,
                        background: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a'
                      }}>
                        ⏳ Sample Pending Collection
                      </span>
                    )}
                    {order.status === 'SAMPLE_COLLECTED' && (
                      <span style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800,
                        background: '#e0f2fe', color: '#0369a1', border: '1.5px solid #bae6fd'
                      }}>
                        🧪 Specimen Accessioned in Lab
                      </span>
                    )}
                    {order.status === 'TESTING_IN_PROGRESS' && (
                      <span style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800,
                        background: '#f3e8ff', color: '#6b21a8', border: '1.5px solid #e9d5ff'
                      }}>
                        ⚙️ Testing in Progress
                      </span>
                    )}
                    {isCompleted && (
                      <>
                        <span style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800,
                          background: '#dcfce7', color: '#166534', border: '1.5px solid #86efac'
                        }}>
                          ✓ Report Published
                        </span>
                        {order.hardcopyFileName && (
                          <a
                            href={`/api/lab/orders/${order.id}/hardcopy`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, borderColor: '#0284c7', color: '#0284c7', textDecoration: 'none' }}
                            title="Download manually uploaded hardcopy"
                          >
                            <FileText size={14} /> Download Hardcopy
                          </a>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setViewingReport(order)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <FileText size={14} /> Virtual Report
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedOrderForPrint(order)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <Download size={14} /> Download / Print PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Book Test Modal */}
      {selectedTestToBook && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.2s ease-out' }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlaskConical size={16} color="#60a5fa" /> Book {selectedTestToBook.name}
              </div>
              <button onClick={() => setSelectedTestToBook(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ padding: 22 }}>
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#1e40af' }}>{selectedTestToBook.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Prep: {selectedTestToBook.fasting}</div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#2563eb' }}>₹{selectedTestToBook.price}</div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Sample Collection Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setBookingForm(f => ({ ...f, collectionType: 'HOME_COLLECTION' }))}
                    style={{
                      padding: 10, borderRadius: 8, cursor: 'pointer',
                      border: bookingForm.collectionType === 'HOME_COLLECTION' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: bookingForm.collectionType === 'HOME_COLLECTION' ? '#eff6ff' : '#f8fafc',
                      color: bookingForm.collectionType === 'HOME_COLLECTION' ? '#1d4ed8' : '#334155',
                      fontWeight: 700, fontSize: '0.78rem'
                    }}
                  >
                    🏠 Home Sample Pickup (Free)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingForm(f => ({ ...f, collectionType: 'HOSPITAL_WALKIN' }))}
                    style={{
                      padding: 10, borderRadius: 8, cursor: 'pointer',
                      border: bookingForm.collectionType === 'HOSPITAL_WALKIN' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: bookingForm.collectionType === 'HOSPITAL_WALKIN' ? '#eff6ff' : '#f8fafc',
                      color: bookingForm.collectionType === 'HOSPITAL_WALKIN' ? '#1d4ed8' : '#334155',
                      fontWeight: 700, fontSize: '0.78rem'
                    }}
                  >
                    🏥 Hospital Diagnostic Center
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Scheduled Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={bookingForm.scheduledDate}
                    onChange={e => setBookingForm(f => ({ ...f, scheduledDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Time Slot</label>
                  <select
                    className="form-input"
                    value={bookingForm.scheduledTime}
                    onChange={e => setBookingForm(f => ({ ...f, scheduledTime: e.target.value }))}
                  >
                    <option value="07:30 AM">07:30 AM (Fasting)</option>
                    <option value="08:30 AM">08:30 AM (Fasting)</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedTestToBook(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={bookingLoading} className="btn btn-primary" style={{ flex: 2, fontWeight: 800 }}>
                  {bookingLoading ? 'Confirming Booking…' : `Pay ₹${selectedTestToBook.price} & Book`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Biomarker Report Modal */}
      {viewingReport && (
        <div
          onClick={() => setViewingReport(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px 16px', overflowY: 'auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 720,
              boxShadow: '0 25px 60px rgba(0,0,0,0.45)', overflow: 'hidden', margin: 'auto'
            }}
          >
            {/* Top Bar - Sticky, easily accessible close */}
            <div
              className="no-print"
              style={{
                position: 'sticky', top: 0, zIndex: 30,
                padding: '14px 20px', background: '#0f172a', color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlaskConical size={16} color="#60a5fa" />
                <span>Verified Diagnostic Test Report</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {viewingReport.hardcopyFileName && (
                  <a
                    href={`/api/lab/orders/${viewingReport.id}/hardcopy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{
                      background: '#0284c7', color: '#fff', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem',
                      fontWeight: 700, padding: '6px 12px', borderRadius: 6
                    }}
                  >
                    📄 Uploaded Hardcopy
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                    color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  style={{
                    background: '#ef4444', border: 'none', color: '#ffffff',
                    padding: '6px 14px', borderRadius: 6, fontSize: '0.82rem',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                  title="Close Window (Esc)"
                >
                  ✕ Close Window
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Report Header */}
              <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 14, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e3a8a', fontFamily: 'Outfit, sans-serif' }}>
                      {viewingReport.labCenterName || ''}
                    </h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                      Laboratory Diagnostic & Pathology Report
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ✓ Electronically Signed
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                      Lab Order ID: #{viewingReport.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient and Test Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 20, fontSize: '0.82rem' }}>
                <div>
                  <div><strong>Patient Name:</strong> {viewingReport.patient?.username || ''}</div>
                  <div style={{ marginTop: 4 }}><strong>Test Name:</strong> {viewingReport.testName || ''}</div>
                  {viewingReport.sampleAccessionNumber && (
                    <div style={{ marginTop: 4 }}><strong>Sample Accession:</strong> {viewingReport.sampleAccessionNumber}</div>
                  )}
                </div>
                <div>
                  <div><strong>Sample Date:</strong> {viewingReport.scheduledDate ? fmtDate(viewingReport.scheduledDate) : ''}</div>
                  <div style={{ marginTop: 4 }}><strong>Report Generated:</strong> {viewingReport.completedAt ? fmtDate(viewingReport.completedAt) : ''}</div>
                  {viewingReport.equipmentUsed && (
                    <div style={{ marginTop: 4 }}><strong>Analytical Instrument:</strong> {viewingReport.equipmentUsed}</div>
                  )}
                </div>
              </div>

              {/* Biomarkers Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>Biomarker / Test Parameter</th>
                    <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>Result Value</th>
                    <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>Unit</th>
                    <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>Biological Reference Interval</th>
                    <th style={{ padding: '8px 10px', color: '#334155', fontWeight: 800 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let items = []
                    try {
                      items = JSON.parse(viewingReport.resultsJson || '[]')
                    } catch { items = [] }
                    if (items.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                            {viewingReport.hardcopyFileName
                              ? 'Hardcopy document attached below.'
                              : 'No digital biomarker rows recorded.'}
                          </td>
                        </tr>
                      )
                    }
                    return items.map((biomarker, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a' }}>{biomarker.name}</td>
                        <td style={{ padding: '10px', fontWeight: 900, color: biomarker.status === 'NORMAL' ? '#166534' : '#b91c1c' }}>
                          {biomarker.value}
                        </td>
                        <td style={{ padding: '10px', color: '#64748b' }}>{biomarker.unit}</td>
                        <td style={{ padding: '10px', color: '#475569' }}>{biomarker.range}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 800,
                            background: biomarker.status === 'NORMAL' ? '#dcfce7' : '#fee2e2',
                            color: biomarker.status === 'NORMAL' ? '#166534' : '#991b1b'
                          }}>
                            {biomarker.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>

              {/* Pathologist Stamp / Remarks Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '1px dashed #cbd5e1', paddingTop: 16 }}>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  {viewingReport.notes && (
                    <div style={{ marginBottom: 6 }}>
                      <strong>Clinical Remarks:</strong> {viewingReport.notes}
                    </div>
                  )}
                  {viewingReport.equipmentUsed && (
                    <div>
                      <strong>Analytical Equipment:</strong> {viewingReport.equipmentUsed}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {viewingReport.pathologistName && (
                    <>
                      <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#1e3a8a' }}>{viewingReport.pathologistName}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>Clinical Pathologist</div>
                    </>
                  )}
                </div>
              </div>

              {/* Uploaded Hardcopy Document Section */}
              {viewingReport.hardcopyFileName && (
                <div style={{ marginTop: 20, padding: 14, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.88rem' }}>📎 Physical Hardcopy Available</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                      {viewingReport.hardcopyOriginalName || viewingReport.hardcopyFileName}
                    </div>
                  </div>
                  <a
                    href={`/api/lab/orders/${viewingReport.id}/hardcopy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <Download size={14} /> Download Hardcopy
                  </a>
                </div>
              )}

              {/* Bottom Back Button */}
              <div className="no-print" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}
                >
                  ← Back to Orders
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', background: '#0f172a' }}
                >
                  Close Window ✕
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Official PDF Print / View Modal */}
      {selectedOrderForPrint && (
        <PrintLabReportModal
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  )
}
