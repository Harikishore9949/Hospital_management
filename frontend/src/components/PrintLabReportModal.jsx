import React from 'react';
import { fmtDate, fmtDateTime } from '../api';
import './PrintLabReportModal.css';

export default function PrintLabReportModal({ order, onClose, onAttachToDocs }) {
  if (!order) return null;

  let biomarkers = [];
  try {
    if (order.resultsJson) {
      biomarkers = JSON.parse(order.resultsJson);
    }
  } catch (e) {
    console.error('Failed to parse biomarkers', e);
  }

  const handlePrint = () => {
    window.print();
  };

  const sampleBarcode = order.sampleAccessionNumber || `ACC-${(100000 + order.id * 37)}`;

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Action Header - Hidden during print */}
        <div className="print-modal-topbar">
          <div className="print-topbar-left">
            <div className="print-icon-box">🧪</div>
            <div>
              <h3 className="print-topbar-title">Diagnostic Laboratory Report Hardcopy</h3>
              <p className="print-topbar-sub">Order #{order.id} • {order.testName}</p>
            </div>
          </div>
          <div className="print-topbar-actions">
            {order.hardcopyFileName && (
              <a
                href={`/api/lab/orders/${order.id}/hardcopy`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-report-print"
                style={{ background: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                📄 Download Uploaded Hardcopy
              </a>
            )}
            {onAttachToDocs && (
              <button
                type="button"
                onClick={() => onAttachToDocs(order)}
                className="btn-report-print"
                style={{ background: '#059669' }}
              >
                📎 Attach to Consultation
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="btn-report-print"
            >
              🖨️ Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-report-close"
              title="Close Report"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Lab Document Content */}
        <div className="lab-report-sheet" id="printable-lab-report">
          
          {/* Laboratory Header */}
          <div className="report-doc-header">
            <div className="report-hospital-brand">
              <div className="report-hospital-logo">+</div>
              <div>
                <h1 className="report-hospital-name">{order.labCenterName || ''}</h1>
                <p className="report-hospital-dept">Diagnostic & Pathology Services</p>
              </div>
            </div>

            <div className="report-stamp-block">
              <span className="report-verified-badge">✓ CLINICAL REPORT</span>
              <div className="report-barcode-text">Barcode: {sampleBarcode}</div>
              {order.labCenterName && <div className="report-ref-lab">Facility: {order.labCenterName}</div>}
            </div>
          </div>

          {/* Patient & Sample Demographics Card */}
          <div className="report-demographics-grid">
            <div>
              <span className="report-demog-label">Patient Name</span>
              <span className="report-demog-val">{order.patient?.username || ''}</span>
            </div>
            <div>
              <span className="report-demog-label">Patient UHID</span>
              <span className="report-demog-val">{order.patient?.id ? `UHID-${1000 + order.patient.id}` : ''}</span>
            </div>
            <div>
              <span className="report-demog-label">Sample Collection</span>
              <span className="report-demog-val">
                {order.sampleCollectedAt ? fmtDateTime(order.sampleCollectedAt) : (order.scheduledDate ? `${fmtDate(order.scheduledDate)} ${order.scheduledTime || ''}` : '')}
              </span>
            </div>
            <div>
              <span className="report-demog-label">Report Released</span>
              <span className="report-demog-val highlight">
                {order.completedAt ? fmtDateTime(order.completedAt) : (order.estimatedResultTime || '')}
              </span>
            </div>

            <div>
              <span className="report-demog-label">Investigation</span>
              <span className="report-demog-val highlight">{order.testName || ''}</span>
            </div>
            <div>
              <span className="report-demog-label">Discipline / Dept</span>
              <span className="report-demog-val">{order.testCategory || ''}</span>
            </div>
            <div>
              <span className="report-demog-label">Collection Mode</span>
              <span className="report-demog-val">
                {order.collectionType === 'HOME_COLLECTION' ? '🏠 Home Phlebotomy' : (order.collectionType ? '🏥 Hospital Diagnostic Center' : '')}
              </span>
            </div>
            <div>
              <span className="report-demog-label">Payment & Transaction</span>
              <span className="report-demog-val paid">
                {order.price != null ? `₹${order.price.toFixed(2)}` : ''} {order.transactionId ? `(${order.transactionId})` : ''}
              </span>
            </div>
          </div>

          {/* Analytical Equipment Strip - Only if provided */}
          {order.equipmentUsed && (
            <div className="report-equipment-strip">
              <div>
                🔬 <strong>Analytical Instrument:</strong> {order.equipmentUsed}
              </div>
            </div>
          )}

          {/* Biomarkers Table */}
          <table className="report-results-table">
            <thead>
              <tr>
                <th>Test Biomarker Analyte</th>
                <th>Observed Value</th>
                <th>Unit</th>
                <th>Biological Reference Range</th>
                <th style={{ textAlign: 'center' }}>Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {biomarkers.length > 0 ? (
                biomarkers.map((b, idx) => {
                  const isAbnormal = b.status === 'ELEVATED' || b.status === 'HIGH' || b.status === 'LOW' || b.status === 'CRITICAL';
                  const tagClass = b.status === 'NORMAL' ? 'normal' : (b.status === 'CRITICAL' ? 'critical' : 'elevated');
                  return (
                    <tr key={idx} className={isAbnormal ? 'abnormal' : ''}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{b.name}</td>
                      <td style={{ fontWeight: 800, fontSize: '0.92rem', color: isAbnormal ? '#b45309' : '#0f172a' }}>
                        {b.value}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.74rem' }}>{b.unit}</td>
                      <td style={{ color: '#475569' }}>{b.range}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`report-status-tag ${tagClass}`}>
                          {b.status || ''}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic' }}>
                    {order.status === 'COMPLETED' ? 'Biomarker summary verified.' : 'Processing in progress.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pathologist Clinical Remarks & Notes - Only if provided */}
          {order.notes && (
            <div className="report-remarks-card">
              <h4 className="report-remarks-title">
                <span>🩺</span> Clinical Remarks:
              </h4>
              <p className="report-remarks-text">
                {order.notes}
              </p>
            </div>
          )}

          {/* Signatures & Accreditation Footer */}
          <div className="report-signatures-row">
            <div>
              <div className="report-qr-text">Order #{order.id}</div>
            </div>

            {order.pathologistName && (
              <div style={{ textAlign: 'right' }}>
                <div className="sig-line">{order.pathologistName}</div>
                <p className="sig-title">Pathologist Sign-off</p>
              </div>
            )}
          </div>

          <div className="report-footer-disclaimer">
            <span>Verified diagnostic report. Hardcopy authorized for medical admission.</span>
            <span>Page 1 of 1 • End of Report</span>
          </div>

        </div>
      </div>
    </div>
  );
}
