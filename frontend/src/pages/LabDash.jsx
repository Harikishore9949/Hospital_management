import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  Activity,
  DollarSign,
  FileText,
  User,
  Search,
  Filter,
  Printer,
  Calendar,
  Sparkles,
  Building2,
  KeyRound,
  RefreshCw,
  TrendingUp,
  Cpu,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Info,
  Beaker,
  AlertCircle,
  Upload
} from 'lucide-react';
import DashLayout from '../components/DashLayout';
import PrintLabReportModal from '../components/PrintLabReportModal';
import {
  getUsername,
  apiGetLabOrders,
  apiLabScheduleSlot,
  apiLabCollectSample,
  apiLabStartTesting,
  apiLabUploadResults,
  apiLabAutoAnalyze,
  apiLabUploadHardcopy,
  apiGetLabStats,
  apiGetLabCatalog,
  apiChangePassword,
  apiChangeUsername,
  fmtDate,
  fmtDateTime
} from '../api';
import '../components/ui.css';
import '../components/dashboard.css';
import './LabDash.css';

/* ═══════════════════════════════════════════════════════════════════════════
   1. MODAL: SCHEDULE SPECIMEN COLLECTION SLOT
   ═══════════════════════════════════════════════════════════════════════════ */
function ScheduleSlotModal({ order, onClose, onSuccess }) {
  const [scheduledDate, setScheduledDate] = useState(
    order.scheduledDate ? (typeof order.scheduledDate === 'string' ? order.scheduledDate : order.scheduledDate.join('-')) : new Date().toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState(order.scheduledTime || '09:00 AM');
  const [slotNotes, setSlotNotes] = useState(order.scheduledSlotNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await apiLabScheduleSlot(order.id, {
        scheduledDate,
        scheduledTime,
        slotNotes
      });
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Failed to update schedule slot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onClose}>
      <div className="lab-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3 className="lab-modal-title">
            <Calendar size={18} color="#38bdf8" /> Schedule Specimen Collection Slot
          </h3>
          <button className="lab-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lab-modal-body">
            {err && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, fontSize: '0.8rem', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{order.testName}</div>
              <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: 3 }}>
                Patient: <strong>{order.patient?.username}</strong> (UHID-{1000 + (order.patient?.id || 1)}) • Mode: {order.collectionType === 'HOME_COLLECTION' ? '🏠 Home Phlebotomy' : '🏥 Hospital Diagnostic Center'}
              </div>
            </div>

            <div className="lab-form-grid-2">
              <div className="lab-form-group">
                <label className="lab-form-label">Specimen Collection Date *</label>
                <input
                  type="date"
                  className="lab-form-input"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="lab-form-group">
                <label className="lab-form-label">Requested Time Window *</label>
                <select
                  className="lab-form-select"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  required
                >
                  <option value="07:30 AM">07:30 AM (Fasting Slot)</option>
                  <option value="08:30 AM">08:30 AM (Fasting Slot)</option>
                  <option value="09:30 AM">09:30 AM (Morning Slot)</option>
                  <option value="10:30 AM">10:30 AM (Morning Slot)</option>
                  <option value="11:30 AM">11:30 AM (Late Morning)</option>
                  <option value="02:00 PM">02:00 PM (Afternoon)</option>
                  <option value="04:00 PM">04:00 PM (Evening)</option>
                </select>
              </div>
            </div>

            <div className="lab-form-group">
              <label className="lab-form-label">Assigned Phlebotomist / Collection Station</label>
              <input
                type="text"
                className="lab-form-input"
                placeholder="e.g. Phlebotomist Assigned or Cubicle No."
                value={slotNotes}
                onChange={e => setSlotNotes(e.target.value)}
              />
              <span style={{ fontSize: '0.70rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                This collection schedule will be visible immediately in the patient's portal.
              </span>
            </div>
          </div>

          <div className="lab-modal-footer">
            <button type="button" className="btn-lab-action view" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-lab-action schedule" disabled={submitting}>
              {submitting ? 'Confirming…' : '✓ Confirm & Schedule Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. MODAL: RECEIVE & ACCESSION SPECIMEN (COLLECT SAMPLE)
   ═══════════════════════════════════════════════════════════════════════════ */
function CollectSampleModal({ order, onClose, onSuccess }) {
  const generatedBarcode = order.sampleAccessionNumber || `ACC-${100000 + (order.id * 37)}`;
  const [barcode, setBarcode] = useState(generatedBarcode);
  const [estimatedResultTime, setEstimatedResultTime] = useState(order.estimatedResultTime || '');
  const [labCenterName, setLabCenterName] = useState(order.labCenterName || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await apiLabCollectSample(order.id, {
        barcode,
        estimatedResultTime,
        labCenterName,
        notes
      });
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Failed to accession sample.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onClose}>
      <div className="lab-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3 className="lab-modal-title">
            <Beaker size={18} color="#38bdf8" /> Receive & Accession Specimen
          </h3>
          <button className="lab-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lab-modal-body">
            {err && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, fontSize: '0.8rem', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: '0.82rem', color: '#166534' }}>
              <div>Specimen: <strong>{order.testName}</strong> • Patient: <strong>{order.patient?.username}</strong></div>
              <div style={{ fontSize: '0.74rem', marginTop: 2 }}>Sample mode: {order.collectionType === 'HOME_COLLECTION' ? 'Home Phlebotomy' : 'Hospital Center Walk-in'}</div>
            </div>

            <div className="lab-form-grid-2">
              <div className="lab-form-group">
                <label className="lab-form-label">Specimen Barcode / Accession #</label>
                <input
                  type="text"
                  className="lab-form-input"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  required
                />
              </div>

              <div className="lab-form-group">
                <label className="lab-form-label">Estimated Result Delivery Time</label>
                <input
                  type="text"
                  className="lab-form-input"
                  value={estimatedResultTime}
                  onChange={e => setEstimatedResultTime(e.target.value)}
                  placeholder="e.g. Today by 04:30 PM (Optional)"
                />
              </div>
            </div>

            <div className="lab-form-group">
              <label className="lab-form-label">Receiving Laboratory Facility</label>
              <input
                type="text"
                className="lab-form-input"
                value={labCenterName}
                onChange={e => setLabCenterName(e.target.value)}
                placeholder="e.g. Central Diagnostics & Pathology (Optional)"
              />
            </div>

            <div className="lab-form-group">
              <label className="lab-form-label">Intake Quality Observations / Notes</label>
              <textarea
                rows={2}
                className="lab-form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="lab-modal-footer">
            <button type="button" className="btn-lab-action view" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-lab-action collect" disabled={submitting}>
              {submitting ? 'Accessioning…' : '✓ Confirm Specimen Intake & Barcode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. MODAL: ENTER RESULTS & PUBLISH TO PATIENT PORTAL
   ═══════════════════════════════════════════════════════════════════════════ */
function ResultsUploadModal({ order, onClose, onSuccess }) {
  const [pathologist, setPathologist] = useState(order.pathologistName || '');
  const [labCenter, setLabCenter] = useState(order.labCenterName || '');
  const [equipment, setEquipment] = useState(order.equipmentUsed || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const getDefaultBiomarkers = () => {
    const t = (order.testName || '').toLowerCase();
    if (t.includes('blood count') || t.includes('cbc')) {
      return [
        { name: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', range: '13.0 - 17.0', status: 'NORMAL' },
        { name: 'Total WBC Count', value: '7,200', unit: 'cells/mcL', range: '4,000 - 11,000', status: 'NORMAL' },
        { name: 'Platelet Count', value: '235,000', unit: '/mcL', range: '150,000 - 450,000', status: 'NORMAL' },
        { name: 'RBC Count', value: '4.85', unit: 'million/mcL', range: '4.50 - 5.90', status: 'NORMAL' },
        { name: 'Hematocrit (PCV)', value: '42.5', unit: '%', range: '38.0 - 50.0', status: 'NORMAL' },
        { name: 'ESR (Westergren)', value: '12', unit: 'mm/1st hr', range: '0 - 15', status: 'NORMAL' }
      ];
    } else if (t.includes('lipid')) {
      return [
        { name: 'Total Cholesterol', value: '188', unit: 'mg/dL', range: '< 200 Desirable', status: 'NORMAL' },
        { name: 'HDL (Good) Cholesterol', value: '54', unit: 'mg/dL', range: '> 40 Optimum', status: 'NORMAL' },
        { name: 'LDL (Bad) Cholesterol', value: '112', unit: 'mg/dL', range: '< 100 Optimal', status: 'ELEVATED' },
        { name: 'Triglycerides', value: '130', unit: 'mg/dL', range: '< 150 Normal', status: 'NORMAL' },
        { name: 'VLDL Cholesterol', value: '24', unit: 'mg/dL', range: '5 - 30', status: 'NORMAL' }
      ];
    } else if (t.includes('thyroid')) {
      return [
        { name: 'TSH (Thyroid Stimulating Hormone)', value: '2.45', unit: 'uIU/mL', range: '0.35 - 4.94', status: 'NORMAL' },
        { name: 'Total Triiodothyronine (T3)', value: '1.18', unit: 'ng/mL', range: '0.80 - 2.00', status: 'NORMAL' },
        { name: 'Total Thyroxine (T4)', value: '8.4', unit: 'ug/dL', range: '5.1 - 14.1', status: 'NORMAL' }
      ];
    } else if (t.includes('diabetes') || t.includes('hba1c')) {
      return [
        { name: 'HbA1c Glycated Hemoglobin', value: '5.8', unit: '%', range: '< 5.7 Normal / 5.7-6.4 Pre-diabetes', status: 'ELEVATED' },
        { name: 'Fasting Blood Glucose', value: '98', unit: 'mg/dL', range: '70 - 99 Normal', status: 'NORMAL' },
        { name: 'Estimated Average Glucose', value: '120', unit: 'mg/dL', range: '< 117 Normal', status: 'ELEVATED' }
      ];
    } else if (t.includes('liver') || t.includes('lft')) {
      return [
        { name: 'SGPT / ALT', value: '28', unit: 'U/L', range: '< 45', status: 'NORMAL' },
        { name: 'SGOT / AST', value: '24', unit: 'U/L', range: '< 35', status: 'NORMAL' },
        { name: 'Total Bilirubin', value: '0.85', unit: 'mg/dL', range: '0.2 - 1.2', status: 'NORMAL' },
        { name: 'Direct Bilirubin', value: '0.22', unit: 'mg/dL', range: '0.0 - 0.3', status: 'NORMAL' },
        { name: 'Alkaline Phosphatase (ALP)', value: '78', unit: 'U/L', range: '44 - 147', status: 'NORMAL' },
        { name: 'Total Protein', value: '7.2', unit: 'g/dL', range: '6.0 - 8.3', status: 'NORMAL' },
        { name: 'Albumin', value: '4.4', unit: 'g/dL', range: '3.5 - 5.0', status: 'NORMAL' }
      ];
    } else if (t.includes('kidney') || t.includes('kft') || t.includes('renal')) {
      return [
        { name: 'Serum Creatinine', value: '0.95', unit: 'mg/dL', range: '0.7 - 1.3', status: 'NORMAL' },
        { name: 'Blood Urea Nitrogen (BUN)', value: '15', unit: 'mg/dL', range: '7 - 20', status: 'NORMAL' },
        { name: 'Uric Acid', value: '5.2', unit: 'mg/dL', range: '3.5 - 7.2', status: 'NORMAL' },
        { name: 'Estimated GFR (eGFR)', value: '98', unit: 'mL/min/1.73m²', range: '> 90 Optimal', status: 'NORMAL' }
      ];
    } else {
      return [
        { name: 'Primary Analyte Specimen', value: 'In-Range Negative', unit: 'Index', range: 'Normal Baseline', status: 'NORMAL' },
        { name: 'Secondary Biochemical Marker', value: '88.5', unit: 'mg/dL', range: '70 - 110', status: 'NORMAL' }
      ];
    }
  };

  const [rows, setRows] = useState(() => {
    try {
      if (order.resultsJson) {
        const parsed = JSON.parse(order.resultsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return getDefaultBiomarkers();
  });

  const updateRow = (index, field, val) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: val } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { name: '', value: '', unit: '', range: '', status: 'NORMAL' }]);
  };

  const removeRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (rows.length === 0) {
      setError('Please provide at least one biomarker parameter.');
      return;
    }
    setSubmitting(true);
    try {
      const resultsJson = JSON.stringify(rows);
      await apiLabUploadResults(order.id, {
        resultsJson,
        pathologistName: pathologist,
        labCenterName: labCenter,
        equipmentUsed: equipment,
        notes
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to upload test results.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onClose}>
      <div className="lab-modal-box lg" onClick={e => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3 className="lab-modal-title">
            <CheckCircle2 size={18} color="#4ade80" /> Enter Results & Publish to Patient Portal
          </h3>
          <button className="lab-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lab-modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, fontSize: '0.8rem', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: '0.82rem', color: '#166534' }}>
              <div>Test: <strong>{order.testName}</strong> • Patient: <strong>{order.patient?.username}</strong> (UHID-{1000 + (order.patient?.id || 1)})</div>
              <div style={{ fontSize: '0.74rem', marginTop: 2 }}>Order #{order.id} • Barcode: {order.sampleAccessionNumber || 'ACC-AUTO'}</div>
            </div>

            <div className="lab-form-grid-2">
              <div className="lab-form-group">
                <label className="lab-form-label">Clinical Pathologist Sign-off</label>
                <input
                  type="text"
                  className="lab-form-input"
                  value={pathologist}
                  onChange={e => setPathologist(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe (Optional)"
                />
              </div>

              <div className="lab-form-group">
                <label className="lab-form-label">Analytical Equipment Used</label>
                <input
                  type="text"
                  className="lab-form-input"
                  value={equipment}
                  onChange={e => setEquipment(e.target.value)}
                  placeholder="e.g. Sysmex / Beckman Coulter Analyzer (Optional)"
                />
              </div>
            </div>

            {/* Biomarker Table */}
            <div className="lab-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="lab-form-label" style={{ marginBottom: 0 }}>Biomarker Parameters & Analytes</label>
                <button type="button" onClick={addRow} className="btn-lab-action view" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  + Add Parameter Row
                </button>
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: 10 }}>
                <table className="biomarker-edit-table" style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Analyte Parameter</th>
                      <th style={{ width: '90px' }}>Value</th>
                      <th style={{ width: '80px' }}>Unit</th>
                      <th>Reference Interval</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '30px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            value={row.name}
                            onChange={e => updateRow(idx, 'name', e.target.value)}
                            placeholder="Biomarker"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.value}
                            onChange={e => updateRow(idx, 'value', e.target.value)}
                            placeholder="Val"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.unit}
                            onChange={e => updateRow(idx, 'unit', e.target.value)}
                            placeholder="Unit"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.range}
                            onChange={e => updateRow(idx, 'range', e.target.value)}
                            placeholder="Normal Range"
                          />
                        </td>
                        <td>
                          <select
                            value={row.status}
                            onChange={e => updateRow(idx, 'status', e.target.value)}
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="ELEVATED">ELEVATED</option>
                            <option value="LOW">LOW</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lab-form-group">
              <label className="lab-form-label">Clinical Remarks & Quality Verification</label>
              <textarea
                rows={2}
                className="lab-form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="lab-modal-footer">
            <button type="button" className="btn-lab-action view" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-lab-action results" disabled={submitting}>
              {submitting ? 'Publishing Report…' : '✓ Publish & Release to Patient Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. MODAL: UPLOAD PHYSICAL HARDCOPY REPORT MANUALLY
   ═══════════════════════════════════════════════════════════════════════════ */
function UploadHardcopyModal({ order, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErr('Please select a file (PDF or Image) to upload.');
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await apiLabUploadHardcopy(order.id, file);
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Failed to upload hardcopy report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onClose}>
      <div className="lab-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3 className="lab-modal-title">
            <Upload size={18} color="#38bdf8" /> Upload Physical Hardcopy Report
          </h3>
          <button className="lab-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleUpload}>
          <div className="lab-modal-body">
            {err && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, fontSize: '0.8rem', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: '0.82rem' }}>
              <div>Test: <strong>{order.testName}</strong> • Patient: <strong>{order.patient?.username}</strong></div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>
                Order #{order.id} {order.sampleAccessionNumber ? `• Barcode: ${order.sampleAccessionNumber}` : ''}
              </div>
            </div>

            {order.hardcopyFileName && (
              <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46' }}>✓ Existing Hardcopy Attached</div>
                  <div style={{ fontSize: '0.72rem', color: '#047857' }}>{order.hardcopyOriginalName || order.hardcopyFileName}</div>
                </div>
                <a
                  href={`/api/lab/orders/${order.id}/hardcopy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lab-action view"
                  style={{ textDecoration: 'none', fontSize: '0.74rem', padding: '4px 10px' }}
                >
                  View File
                </a>
              </div>
            )}

            <div className="lab-form-group">
              <label className="lab-form-label">
                Select Scanned Report or Hardcopy File (PDF, PNG, JPG) *
              </label>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="lab-form-input"
                style={{ padding: '8px' }}
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                This file will be securely stored and immediately available to the patient in their portal to view and download.
              </span>
            </div>
          </div>

          <div className="lab-modal-footer">
            <button type="button" className="btn-lab-action view" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-lab-action results" disabled={submitting} style={{ background: '#0284c7' }}>
              {submitting ? 'Uploading…' : '✓ Upload & Release Hardcopy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. MODAL: DETAILED TEST CLINICAL INFRASTRUCTURE VIEW
   ═══════════════════════════════════════════════════════════════════════════ */
function TestDetailModal({ test, onClose }) {
  if (!test) return null;

  return (
    <div className="lab-modal-overlay" onClick={onClose}>
      <div className="lab-modal-box lg" onClick={e => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3 className="lab-modal-title">
            <FlaskConical size={18} color="#38bdf8" /> {test.name}
          </h3>
          <button className="lab-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="lab-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div>
              <span className="lab-test-cat-badge">{test.category}</span>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Test Code: <strong>{test.id}</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Hospital Charge</div>
              <div className="lab-test-price">₹{test.price}</div>
            </div>
          </div>

          <div className="lab-form-group">
            <label className="lab-form-label">Clinical Purpose & Significance</label>
            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
              {test.description}
            </p>
          </div>

          <div className="lab-form-group">
            <label className="lab-form-label">🔬 Analytical Equipment & Laboratory System</label>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', color: '#166534', fontSize: '0.84rem', fontWeight: 600 }}>
              {test.equipmentUsed || ''}
            </div>
          </div>

          <div className="lab-form-group">
            <label className="lab-form-label">🧪 How The Test Is Conducted (Procedure & Methodology)</label>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '12px 14px', color: '#334155', fontSize: '0.82rem', lineHeight: 1.5 }}>
              {test.howConducted || ''}
            </div>
          </div>

          <div className="lab-form-grid-2" style={{ marginBottom: 16 }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.80rem' }}>
              <strong>🩸 Specimen Required:</strong><br />
              <span style={{ color: '#64748b' }}>{test.sampleType || ''}</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.80rem' }}>
              <strong>⏱️ Turnaround Time:</strong><br />
              <span style={{ color: '#0369a1', fontWeight: 700 }}>{test.turnaround || ''}</span>
            </div>
          </div>

          <div className="lab-form-group">
            <label className="lab-form-label">Key Biomarkers & Analytes Measured</label>
            <div className="lab-biomarkers-tags">
              {(test.biomarkers || []).map((b, i) => (
                <span key={i} className="lab-biomarker-tag">
                  • {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lab-modal-footer">
          <button className="btn-lab-action view" onClick={onClose}>Close Window</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. SECURITY & CREDENTIALS CARD
   ═══════════════════════════════════════════════════════════════════════════ */
function LabSecurityCard() {
  const currentUsername = getUsername();
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [userMsg, setUserMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  async function handleUsernameSubmit(e) {
    e.preventDefault();
    setUserMsg(null);
    if (!newUsername || newUsername.trim().length < 3) {
      setUserMsg({ type: 'warning', text: 'Username must be at least 3 characters.' });
      return;
    }
    setUserLoading(true);
    try {
      const res = await apiChangeUsername(newUsername.trim());
      setUserMsg({ type: 'success', text: `✅ Username changed to '${res.username}'.` });
      setNewUsername('');
    } catch (err) {
      setUserMsg({ type: 'error', text: err.message || 'Failed to update username.' });
    } finally {
      setUserLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPassMsg(null);
    if (!currentPassword) {
      setPassMsg({ type: 'warning', text: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'warning', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'warning', text: 'New passwords do not match.' });
      return;
    }
    setPassLoading(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      setPassMsg({ type: 'success', text: '✅ Password updated successfully! Use new password on next login.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPassLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
      {/* Change Username */}
      <div className="card" style={{ padding: 24, borderRadius: 18, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Facility Account ID</h3>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Current: <strong style={{ color: '#0284c7' }}>{currentUsername}</strong></span>
          </div>
        </div>

        {userMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: '0.78rem', background: userMsg.type === 'success' ? '#f0fdf4' : '#fffbeb', color: userMsg.type === 'success' ? '#166534' : '#92400e', border: '1px solid #e2e8f0' }}>
            {userMsg.text}
          </div>
        )}

        <form onSubmit={handleUsernameSubmit}>
          <div className="lab-form-group">
            <label className="lab-form-label">New Lab Identifier</label>
            <input
              type="text"
              className="lab-form-input"
              placeholder="e.g. central_lab_unit"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={userLoading}>
            {userLoading ? 'Updating…' : 'Update Facility Username'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card" style={{ padding: 24, borderRadius: 18, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Update Lab Password</h3>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Authorized administrative credentials</span>
          </div>
        </div>

        {passMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: '0.78rem', background: passMsg.type === 'success' ? '#f0fdf4' : '#fffbeb', color: passMsg.type === 'success' ? '#166534' : '#92400e', border: '1px solid #e2e8f0' }}>
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="lab-form-group">
            <label className="lab-form-label">Current Password *</label>
            <input
              type="password"
              className="lab-form-input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="lab-form-grid-2">
            <div className="lab-form-group">
              <label className="lab-form-label">New Password *</label>
              <input
                type="password"
                className="lab-form-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="lab-form-group">
              <label className="lab-form-label">Confirm Password *</label>
              <input
                type="password"
                className="lab-form-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#7c3aed' }} disabled={passLoading}>
            {passLoading ? 'Saving…' : 'Save New Access Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CENTRAL LAB DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LabDash() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'analytics' | 'catalog' | 'security'
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingSamples: 0,
    samplesCollected: 0,
    testingInProgress: 0,
    completed: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState(null);
  const [selectedOrderForCollect, setSelectedOrderForCollect] = useState(null);
  const [selectedOrderForUpload, setSelectedOrderForUpload] = useState(null);
  const [selectedOrderForHardcopy, setSelectedOrderForHardcopy] = useState(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchLabData = async () => {
    try {
      setLoading(true);
      const [orderList, statData, catalogData] = await Promise.all([
        apiGetLabOrders().catch(() => []),
        apiGetLabStats().catch(() => ({})),
        apiGetLabCatalog().catch(() => [])
      ]);
      setOrders(orderList || []);
      setStats(statData || {});
      setCatalog(catalogData || []);
    } catch (err) {
      console.error('Failed to load lab operations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  const handleStartTesting = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      await apiLabStartTesting(orderId, {
        technicianName: getUsername(),
        estimatedResultTime: 'Results ready in 2 to 3 hours'
      });
      await fetchLabData();
    } catch (err) {
      alert(err.message || 'Failed to start testing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAutoAnalyze = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      await apiLabAutoAnalyze(orderId);
      await fetchLabData();
    } catch (err) {
      alert(err.message || 'Failed to analyze specimen.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesFilter = filterStatus === 'ALL' || o.status === filterStatus;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (o.testName && o.testName.toLowerCase().includes(term)) ||
        (o.patient?.username && o.patient.username.toLowerCase().includes(term)) ||
        (o.transactionId && o.transactionId.toLowerCase().includes(term)) ||
        (o.sampleAccessionNumber && o.sampleAccessionNumber.toLowerCase().includes(term)) ||
        (o.id && o.id.toString().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [orders, filterStatus, searchTerm]);

  // Analytics Computations
  const analyticsData = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'COMPLETED').length;
    const pending = orders.filter(o => o.status === 'SAMPLE_PENDING').length;
    const collected = orders.filter(o => o.status === 'SAMPLE_COLLECTED').length;
    const inProgress = orders.filter(o => o.status === 'TESTING_IN_PROGRESS').length;

    const deptMap = {};
    orders.forEach(o => {
      const dept = o.testCategory || 'General Diagnostics';
      if (!deptMap[dept]) deptMap[dept] = { count: 0, revenue: 0 };
      deptMap[dept].count += 1;
      deptMap[dept].revenue += (o.price || 0);
    });

    const tatCompliance = total > 0 ? 98.4 : 100;

    return {
      total,
      completed,
      pending,
      collected,
      inProgress,
      deptBreakdown: Object.entries(deptMap).map(([dept, data]) => ({ dept, ...data })),
      tatCompliance
    };
  }, [orders]);

  const navItems = [
    { id: 'orders',    label: 'Diagnostic Orders',          icon: <FlaskConical size={18} /> },
    { id: 'analytics', label: 'Analytics & Transactions',   icon: <BarChart3 size={18} /> },
    { id: 'catalog',   label: 'Lab Infrastructure & Tests', icon: <Cpu size={18} /> },
    { id: 'security',  label: 'Facility Credentials',       icon: <Building2 size={18} /> }
  ];

  return (
    <DashLayout
      role="LAB"
      activeView={activeTab}
      setActiveView={setActiveTab}
      navItems={navItems}
      topbarTitle="Central Pathology & Diagnostic Laboratory"
    >
      <div>
        {/* Top Operations Header Banner */}
        <div className="lab-banner">
          <div className="lab-banner-content">
            <div>
              <div className="lab-accreditation-badge">
                <ShieldCheck size={14} color="#34d399" /> NABL ISO-15189:2022 Accredited Reference Laboratory
              </div>
              <h1 className="lab-banner-title">Central Diagnostic & Pathology Hub</h1>
              <p className="lab-banner-subtitle">
                Receive incoming patient requests upon payment, schedule specimen collection times, accession clinical barcodes, operate automated analyzers, and publish verified digital reports.
              </p>
            </div>

            <div className="lab-banner-actions">
              <button className="btn-lab-glass" onClick={fetchLabData}>
                <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh Operations
              </button>
            </div>
          </div>
        </div>

        {/* Analytical KPI Counters */}
        <div className="lab-kpi-grid">
          <div className="lab-kpi-card pending">
            <div className="lab-kpi-header">
              <span className="lab-kpi-label">Pending Samples</span>
              <div className="lab-kpi-icon pending"><Clock size={16} /></div>
            </div>
            <div className="lab-kpi-val">{stats.pendingSamples || 0}</div>
            <div className="lab-kpi-sub">Awaiting Patient Collection</div>
          </div>

          <div className="lab-kpi-card collected">
            <div className="lab-kpi-header">
              <span className="lab-kpi-label">Specimens Accessioned</span>
              <div className="lab-kpi-icon collected"><Beaker size={16} /></div>
            </div>
            <div className="lab-kpi-val">{stats.samplesCollected || 0}</div>
            <div className="lab-kpi-sub">Barcoded & Ready for Analyzer</div>
          </div>

          <div className="lab-kpi-card testing">
            <div className="lab-kpi-header">
              <span className="lab-kpi-label">In Clinical Testing</span>
              <div className="lab-kpi-icon testing"><Activity size={16} /></div>
            </div>
            <div className="lab-kpi-val">{stats.testingInProgress || 0}</div>
            <div className="lab-kpi-sub">Active Analyzer Runs</div>
          </div>

          <div className="lab-kpi-card completed">
            <div className="lab-kpi-header">
              <span className="lab-kpi-label">Reports Published</span>
              <div className="lab-kpi-icon completed"><CheckCircle2 size={16} /></div>
            </div>
            <div className="lab-kpi-val">{stats.completed || 0}</div>
            <div className="lab-kpi-sub">Delivered to Patient Portal</div>
          </div>

          <div className="lab-kpi-card revenue">
            <div className="lab-kpi-header">
              <span className="lab-kpi-label">Verified Revenue</span>
              <div className="lab-kpi-icon revenue"><DollarSign size={16} /></div>
            </div>
            <div className="lab-kpi-val">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="lab-kpi-sub">100% Patient Prepaid</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="lab-nav-tabs">
          <button
            className={`lab-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FlaskConical size={16} /> Diagnostic Orders ({orders.length})
          </button>
          <button
            className={`lab-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} /> Data Analysis & Ledger
          </button>
          <button
            className={`lab-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Cpu size={16} /> Lab Catalog & Infrastructure ({catalog.length})
          </button>
          <button
            className={`lab-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Building2 size={16} /> Facility ID & Security
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 1: DIAGNOSTIC ORDERS QUEUE
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div>
            {/* Toolbar */}
            <div className="lab-toolbar">
              <div className="lab-filter-pills">
                {[
                  { id: 'ALL', label: 'All Orders' },
                  { id: 'SAMPLE_PENDING', label: 'Pending Samples' },
                  { id: 'SAMPLE_COLLECTED', label: 'Accessioned' },
                  { id: 'TESTING_IN_PROGRESS', label: 'In Testing' },
                  { id: 'COMPLETED', label: 'Published' }
                ].map(p => (
                  <button
                    key={p.id}
                    className={`lab-pill-btn ${filterStatus === p.id ? 'active' : ''}`}
                    onClick={() => setFilterStatus(p.id)}
                  >
                    {p.label}
                    <span className="lab-pill-badge">
                      {p.id === 'ALL' ? orders.length : orders.filter(o => o.status === p.id).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="lab-search-box">
                <Search size={15} className="lab-search-icon" />
                <input
                  type="text"
                  placeholder="Search by patient, test, barcode, TXN ID…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="lab-table-card">
              <div className="lab-table-wrapper">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Order ID & Barcode</th>
                      <th>Patient (UHID)</th>
                      <th>Investigation / Test</th>
                      <th>Collection Mode & Slot</th>
                      <th>Payment & Transaction</th>
                      <th>Processing State & Est. Result</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                          <FlaskConical size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                          <div style={{ fontWeight: 700, color: '#475569' }}>No diagnostic orders match current filter</div>
                          <div style={{ fontSize: '0.78rem' }}>Patient bookings will appear in real time once confirmed.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => {
                        const isPending = order.status === 'SAMPLE_PENDING';
                        const isCollected = order.status === 'SAMPLE_COLLECTED';
                        const isTesting = order.status === 'TESTING_IN_PROGRESS';
                        const isCompleted = order.status === 'COMPLETED';

                        return (
                          <tr key={order.id}>
                            {/* Order ID & Barcode */}
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>#{order.id}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.70rem', color: '#0284c7', fontWeight: 700 }}>
                                {order.sampleAccessionNumber || '—'}
                              </div>
                            </td>

                            {/* Patient Demographics */}
                            <td>
                              <div className="patient-cell-name">{order.patient?.username || 'Patient'}</div>
                              <div className="patient-cell-sub">UHID-{(1000 + (order.patient?.id || 1))}</div>
                            </td>

                            {/* Test & Dept */}
                            <td>
                              <div className="test-cell-title">{order.testName}</div>
                              <span className="test-cell-category">{order.testCategory || 'Diagnostics'}</span>
                            </td>

                            {/* Collection Mode & Scheduled Slot */}
                            <td>
                              <div style={{ fontWeight: 600, color: '#334155' }}>
                                {order.collectionType === 'HOME_COLLECTION' ? '🏠 Home Phlebotomy' : '🏥 Hospital Diagnostic Center'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                                📅 {order.scheduledDate ? fmtDate(order.scheduledDate) : 'Today'} • {order.scheduledTime || '09:00 AM'}
                              </div>
                            </td>

                            {/* Payment Status */}
                            <td>
                              <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.86rem' }}>
                                ₹{order.price?.toFixed(2)}
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#64748b' }}>
                                {order.transactionId || 'PAID'}
                              </div>
                            </td>

                            {/* Processing State & Estimated Result Time */}
                            <td>
                              {isPending && <span className="status-chip pending">⏳ Sample Pending</span>}
                              {isCollected && <span className="status-chip collected">🧪 Sample Accessioned</span>}
                              {isTesting && <span className="status-chip testing">⚙️ In Analyzer</span>}
                              {isCompleted && <span className="status-chip completed">✓ Published to Portal</span>}

                              <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: 4 }}>
                                {order.estimatedResultTime ? `⏱️ ${order.estimatedResultTime}` : (isCompleted && order.completedAt ? `Released: ${fmtDateTime(order.completedAt)}` : '')}
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div className="lab-action-group" style={{ justifyContent: 'flex-end' }}>
                                {/* 1. Schedule / Update Slot */}
                                <button
                                  className="btn-lab-action schedule"
                                  onClick={() => setSelectedOrderForSchedule(order)}
                                  title="Schedule or update sample collection slot"
                                >
                                  <Calendar size={13} /> {isPending ? 'Schedule Slot' : 'Reschedule'}
                                </button>

                                {/* 2. Collect / Accession Sample */}
                                {isPending && (
                                  <button
                                    className="btn-lab-action collect"
                                    onClick={() => setSelectedOrderForCollect(order)}
                                  >
                                    <Beaker size={13} /> Collect Sample
                                  </button>
                                )}

                                {/* 3. Load into Analyzer */}
                                {isCollected && (
                                  <button
                                    className="btn-lab-action analyze"
                                    onClick={() => handleStartTesting(order.id)}
                                    disabled={actionLoadingId === order.id}
                                  >
                                    <Cpu size={13} /> Load Analyzer
                                  </button>
                                )}

                                {/* 4. Quick Auto-Analyze */}
                                {isTesting && (
                                  <button
                                    className="btn-lab-action analyze"
                                    style={{ background: '#4f46e5' }}
                                    onClick={() => handleAutoAnalyze(order.id)}
                                    disabled={actionLoadingId === order.id}
                                    title="Auto-generate clinical reference biomarker values"
                                  >
                                    <Sparkles size={13} /> Auto-Analyze
                                  </button>
                                )}

                                {/* 5. Enter Detailed Biomarkers */}
                                {(isCollected || isTesting || isCompleted) && (
                                  <button
                                    className="btn-lab-action results"
                                    onClick={() => setSelectedOrderForUpload(order)}
                                  >
                                    <CheckCircle2 size={13} /> {isCompleted ? 'Edit Results' : 'Enter Results'}
                                  </button>
                                )}

                                {/* 6. Upload Scanned Hardcopy Manually */}
                                <button
                                  className="btn-lab-action collect"
                                  style={{ background: '#0284c7' }}
                                  onClick={() => setSelectedOrderForHardcopy(order)}
                                  title="Upload or manage physical hardcopy test report"
                                >
                                  <Upload size={13} /> {order.hardcopyFileName ? 'Hardcopy ✓' : 'Upload Hardcopy'}
                                </button>

                                {/* 7. Print Accredited Hardcopy */}
                                <button
                                  className="btn-lab-action view"
                                  onClick={() => setSelectedOrderForPrint(order)}
                                  title="Print Official Accredited Lab Report"
                                >
                                  <Printer size={13} /> Print Hardcopy
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 2: LABORATORY DATA ANALYSIS & FINANCIAL LEDGER
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="lab-analytics-section">
            <div className="lab-analytics-row">
              {/* Pipeline Progress Analysis */}
              <div className="lab-chart-card">
                <h3 className="lab-chart-title">
                  <span>Specimen Processing Pipeline</span>
                  <span style={{ fontSize: '0.78rem', color: '#059669', background: '#d1fae5', padding: '3px 10px', borderRadius: 9999 }}>
                    TAT Compliance: {analyticsData.tatCompliance}%
                  </span>
                </h3>

                <p style={{ fontSize: '0.80rem', color: '#64748b', margin: '0 0 14px 0' }}>
                  Real-time tracking of diagnostic specimens across registration, phlebotomy, analyzer run, and clinical validation.
                </p>

                <div className="pipeline-progress-bar">
                  <div
                    className="pipeline-segment pending"
                    style={{ width: `${analyticsData.total > 0 ? (analyticsData.pending / analyticsData.total) * 100 : 25}%` }}
                    title={`Pending: ${analyticsData.pending}`}
                  />
                  <div
                    className="pipeline-segment collected"
                    style={{ width: `${analyticsData.total > 0 ? (analyticsData.collected / analyticsData.total) * 100 : 25}%` }}
                    title={`Accessioned: ${analyticsData.collected}`}
                  />
                  <div
                    className="pipeline-segment testing"
                    style={{ width: `${analyticsData.total > 0 ? (analyticsData.inProgress / analyticsData.total) * 100 : 25}%` }}
                    title={`In Testing: ${analyticsData.inProgress}`}
                  />
                  <div
                    className="pipeline-segment completed"
                    style={{ width: `${analyticsData.total > 0 ? (analyticsData.completed / analyticsData.total) * 100 : 25}%` }}
                    title={`Published: ${analyticsData.completed}`}
                  />
                </div>

                <div className="pipeline-legend">
                  <div className="pipeline-legend-item">
                    <span className="pipeline-legend-dot pending" />
                    <span>Pending Intake: <strong>{analyticsData.pending}</strong></span>
                  </div>
                  <div className="pipeline-legend-item">
                    <span className="pipeline-legend-dot collected" />
                    <span>Accessioned: <strong>{analyticsData.collected}</strong></span>
                  </div>
                  <div className="pipeline-legend-item">
                    <span className="pipeline-legend-dot testing" />
                    <span>In Analyzer: <strong>{analyticsData.inProgress}</strong></span>
                  </div>
                  <div className="pipeline-legend-item">
                    <span className="pipeline-legend-dot completed" />
                    <span>Published: <strong>{analyticsData.completed}</strong></span>
                  </div>
                </div>
              </div>

              {/* Department Volume & Revenue Breakdown */}
              <div className="lab-chart-card">
                <h3 className="lab-chart-title">
                  <span>Specialty Department Share</span>
                  <TrendingUp size={16} color="#0284c7" />
                </h3>

                <div className="dept-list">
                  {analyticsData.deptBreakdown.length === 0 ? (
                    <div style={{ fontSize: '0.80rem', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No tests recorded yet</div>
                  ) : (
                    analyticsData.deptBreakdown.map((item, idx) => (
                      <div key={idx} className="dept-item">
                        <div>
                          <div className="dept-name">{item.dept}</div>
                          <div className="dept-vol">{item.count} orders booked</div>
                        </div>
                        <div className="dept-rev">₹{item.revenue.toLocaleString('en-IN')}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Financial Transactions & Reconciliation Ledger */}
            <div className="lab-table-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                    Financial Transactions & Payment Reconciliation
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                    All patient digital payments processed and credited to Central Diagnostic Laboratory account.
                  </p>
                </div>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                  Total Collected: ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="lab-table-wrapper">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Order ID</th>
                      <th>Patient Name</th>
                      <th>Investigation</th>
                      <th>Transaction Date</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                          {order.transactionId || `TXN-LAB-${order.id}`}
                        </td>
                        <td style={{ fontWeight: 700 }}>#{order.id}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{order.patient?.username || 'Patient'}</td>
                        <td>{order.testName}</td>
                        <td style={{ color: '#64748b', fontSize: '0.74rem' }}>{fmtDateTime(order.bookedAt)}</td>
                        <td>
                          <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: '0.70rem' }}>
                            ✓ {order.paymentStatus || 'PAID'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.92rem' }}>
                          ₹{order.price?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 3: LAB TEST CATALOG & EQUIPMENT INFRASTRUCTURE
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'catalog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                  Diagnostic Catalog & Clinical Equipment Infrastructure
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.80rem', color: '#64748b' }}>
                  All tests currently active in the Patient Booking Portal, detailing clinical procedures, automated analyzer systems, and cost.
                </p>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '6px 14px', borderRadius: 9999 }}>
                🧪 Active Catalog: {catalog.length} Certified Tests
              </div>
            </div>

            <div className="lab-catalog-grid">
              {catalog.map(test => (
                <div key={test.id} className="lab-test-card">
                  <div>
                    <div className="lab-test-card-header">
                      <span className="lab-test-cat-badge">{test.category}</span>
                      <div className="lab-test-price">₹{test.price}</div>
                    </div>

                    <h4 className="lab-test-title">🧪 {test.name}</h4>
                    <p className="lab-test-desc">{test.description}</p>

                    {/* Equipment Highlight Box */}
                    {test.equipmentUsed && (
                      <div className="lab-equipment-highlight">
                        <Cpu size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Equipment:</strong> {test.equipmentUsed}
                        </div>
                      </div>
                    )}

                    {/* Specs Box */}
                    <div className="lab-specs-box">
                      <div className="lab-specs-item">
                        <strong>⏱️ Turnaround:</strong> <span>{test.turnaround}</span>
                      </div>
                      <div className="lab-specs-item">
                        <strong>🩸 Specimen:</strong> <span>{test.sampleType || ''}</span>
                      </div>
                      <div className="lab-specs-item">
                        <strong>ℹ️ Prep / Fasting:</strong> <span>{test.fasting}</span>
                      </div>
                    </div>

                    {/* Key Biomarkers */}
                    <div className="lab-biomarkers-wrap">
                      <div className="lab-biomarkers-label">Tested Biomarkers & Analytes:</div>
                      <div className="lab-biomarkers-tags">
                        {(test.biomarkers || []).slice(0, 5).map((b, i) => (
                          <span key={i} className="lab-biomarker-tag">• {b}</span>
                        ))}
                        {(test.biomarkers || []).length > 5 && (
                          <span className="lab-biomarker-tag">+{test.biomarkers.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-lab-action view"
                    onClick={() => setSelectedTestDetail(test)}
                    style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontWeight: 700 }}
                  >
                    View Step-by-Step Procedure & Equipment Specs <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 4: FACILITY ID & SECURITY
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <LabSecurityCard />
        )}

        {/* ── Modals ──────────────────────────────────────────────────────── */}
        {selectedOrderForSchedule && (
          <ScheduleSlotModal
            order={selectedOrderForSchedule}
            onClose={() => setSelectedOrderForSchedule(null)}
            onSuccess={() => {
              setSelectedOrderForSchedule(null);
              fetchLabData();
            }}
          />
        )}

        {selectedOrderForCollect && (
          <CollectSampleModal
            order={selectedOrderForCollect}
            onClose={() => setSelectedOrderForCollect(null)}
            onSuccess={() => {
              setSelectedOrderForCollect(null);
              fetchLabData();
            }}
          />
        )}

        {selectedOrderForUpload && (
          <ResultsUploadModal
            order={selectedOrderForUpload}
            onClose={() => setSelectedOrderForUpload(null)}
            onSuccess={() => {
              setSelectedOrderForUpload(null);
              fetchLabData();
            }}
          />
        )}

        {selectedOrderForHardcopy && (
          <UploadHardcopyModal
            order={selectedOrderForHardcopy}
            onClose={() => setSelectedOrderForHardcopy(null)}
            onSuccess={() => {
              setSelectedOrderForHardcopy(null);
              fetchLabData();
            }}
          />
        )}

        {selectedOrderForPrint && (
          <PrintLabReportModal
            order={selectedOrderForPrint}
            onClose={() => setSelectedOrderForPrint(null)}
          />
        )}

        {selectedTestDetail && (
          <TestDetailModal
            test={selectedTestDetail}
            onClose={() => setSelectedTestDetail(null)}
          />
        )}
      </div>
    </DashLayout>
  );
}
