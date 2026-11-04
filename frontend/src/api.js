// api.js — In-memory JWT store + all API helpers
// JWT is NEVER stored in localStorage/sessionStorage — lives only in module memory.

let _token    = null;
let _username = null;
let _role     = null;

// ─── Auth state ───────────────────────────────────────────────
export const setAuth = (token, username, role) => {
  _token = token; _username = username; _role = role;
};
export const clearAuth = () => { _token = null; _username = null; _role = null; };
export const getToken    = () => _token;
export const getUsername = () => _username;
export const getRole     = () => _role;
export const isAuthenticated = () => !!_token;

// ─── Core fetch wrapper ───────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(path, { ...options, headers });

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof body === 'object'
      ? (body.message || body.error || `HTTP ${res.status}`)
      : (typeof body === 'string' && body.length < 300 ? body : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return body;
}

// ─── Auth endpoints ───────────────────────────────────────────
export async function apiRegister(username, password, role) {
  return apiFetch('/api/register', { method: 'POST', body: JSON.stringify({ username, password, role }) });
}

export async function apiLogin(username, password) {
  const data = await apiFetch('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  setAuth(data.token, data.username, data.role);
  return data;
}

// ─── Doctor endpoints ─────────────────────────────────────────
export const apiCreateSlot         = (payload) => apiFetch('/api/doctor/availability', { method: 'POST', body: JSON.stringify(payload) });
export const apiDeleteSlot         = (slotId)  => apiFetch(`/api/doctor/availability/${slotId}`, { method: 'DELETE' });
export const apiGetMySlots         = ()         => apiFetch('/api/doctor/slots');
export const apiGetAllAppointments = ()         => apiFetch('/api/doctor/appointments');
export const apiGetPendingAppts    = ()         => apiFetch('/api/doctor/appointments/pending');
export const apiAcceptAppointment  = (id)       => apiFetch(`/api/doctor/appointments/${id}/accept`, { method: 'POST' });
export const apiRejectAppointment  = (id)       => apiFetch(`/api/doctor/appointments/${id}/reject`, { method: 'POST' });
export const apiDoctorCancelAppointment = (id, reason) => apiFetch(`/api/doctor/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
export const apiGetMyDoctorProfile = ()         => apiFetch('/api/doctor/profile');
export const apiSaveDoctorProfile  = (payload)  => apiFetch('/api/doctor/profile', { method: 'PUT', body: JSON.stringify(payload) });

// ─── Patient endpoints ────────────────────────────────────────
export const apiGetAllDoctors          = ()          => apiFetch('/api/patient/doctors');
export const apiGetDoctorSlots         = (doctorId)  => apiFetch(`/api/patient/doctors/${doctorId}/availability`);
export const apiGetDoctorProfile       = (doctorId)  => apiFetch(`/api/patient/doctors/${doctorId}/profile`);
export const apiLikeDoctor             = (doctorId)  => apiFetch(`/api/patient/doctors/${doctorId}/like`, { method: 'POST' });
export const apiBookAppointment        = (payload)   => apiFetch('/api/patient/appointments', { method: 'POST', body: JSON.stringify(payload) });
export const apiGetMyAppointments      = ()          => apiFetch('/api/patient/appointments/my');
export const apiCancelAppointment      = (id, reason)=> apiFetch(`/api/patient/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
export const apiRescheduleAppointment  = (id, newSlotId)=> apiFetch(`/api/patient/appointments/${id}/reschedule`, { method: 'POST', body: JSON.stringify({ newSlotId }) });
export const apiPayAppointment         = (id, transactionId)=> apiFetch(`/api/patient/appointments/${id}/pay`, { method: 'POST', body: JSON.stringify({ transactionId }) });

// ─── Patient Vitals & EHR ─────────────────────────────────────
export const apiRecordVitals           = (payload)   => apiFetch('/api/patient/vitals', { method: 'POST', body: JSON.stringify(payload) });
export const apiGetVitals              = ()          => apiFetch('/api/patient/vitals');
export const apiDeleteVital            = (id)        => apiFetch(`/api/patient/vitals/${id}`, { method: 'DELETE' });

// ─── Diagnostics & Lab Tests ─────────────────────────────────
export const apiGetLabCatalog          = ()          => apiFetch('/api/patient/lab-tests/catalog');
export const apiBookLabTest            = (payload)   => apiFetch('/api/patient/lab-tests', { method: 'POST', body: JSON.stringify(payload) });
export const apiGetMyLabOrders         = ()          => apiFetch('/api/patient/lab-tests/my');

// ─── Hospital Facilities (Beds & Ambulance) ───────────────────
export const apiGetHospitalBeds        = ()          => apiFetch('/api/patient/hospital-facilities/beds');
export const apiBookHospitalBed        = (payload)   => apiFetch('/api/patient/hospital-facilities/book-bed', { method: 'POST', body: JSON.stringify(payload) });
export const apiGetMyBedRequests       = ()          => apiFetch('/api/patient/hospital-facilities/my-bed-requests');
export const apiGetAmbulanceStatus     = ()          => apiFetch('/api/patient/hospital-facilities/ambulance');

// Admin Bed & Inpatient Management
export const apiAdminGetHospitalBeds   = ()          => apiFetch('/api/admin/hospital-facilities/beds');
export const apiAdminGetBedRequests    = ()          => apiFetch('/api/admin/hospital-facilities/bed-requests');
export const apiAdminAcceptBedRequest  = (id, payload)=> apiFetch(`/api/admin/hospital-facilities/bed-requests/${id}/accept`, { method: 'POST', body: JSON.stringify(payload || {}) });
export const apiAdminRejectBedRequest  = (id, payload)=> apiFetch(`/api/admin/hospital-facilities/bed-requests/${id}/reject`, { method: 'POST', body: JSON.stringify(payload || {}) });
export const apiAdminUpdateBedStatus   = (payload)   => apiFetch('/api/admin/hospital-facilities/beds/update-status', { method: 'POST', body: JSON.stringify(payload) });

// ─── Patient Profile ───────────────────────────────────────────────
export const apiGetPatientProfile      = ()          => apiFetch('/api/patient/profile');
export const apiSavePatientProfile     = (payload)   => apiFetch('/api/patient/profile', { method: 'PUT', body: JSON.stringify(payload) });

// ─── Pharmacy & Medicine Inventory & Orders ─────────────────────
export const apiPharmacyTest                = ()               => apiFetch('/api/pharmacy/test');
export const apiGetPharmacyMedicines        = ()               => apiFetch('/api/pharmacy/medicines');
export const apiAddPharmacyMedicine         = (payload)        => apiFetch('/api/pharmacy/medicines', { method: 'POST', body: JSON.stringify(payload) });
export const apiAdjustPharmacyMedicine      = (id, payload)    => apiFetch(`/api/pharmacy/medicines/${id}/adjust`, { method: 'POST', body: JSON.stringify(payload) });
export const apiDeletePharmacyMedicine      = (id)             => apiFetch(`/api/pharmacy/medicines/${id}`, { method: 'DELETE' });
export const apiGetPharmacyAnalytics       = ()               => apiFetch('/api/pharmacy/analytics');
export const apiGetPharmacistProfile        = ()               => apiFetch('/api/pharmacy/profile');
export const apiSavePharmacistProfile       = (payload)        => apiFetch('/api/pharmacy/profile', { method: 'PUT', body: JSON.stringify(payload) });
export const apiCheckPrescriptionAvailability= (prescriptionId)=> apiFetch(`/api/pharmacy/prescriptions/${prescriptionId}/check`);
export const apiPlaceMedicineOrder          = (prescriptionId) => apiFetch('/api/pharmacy/orders', { method: 'POST', body: JSON.stringify({ prescriptionId }) });
export const apiGetMyMedicineOrders         = ()               => apiFetch('/api/pharmacy/orders/my');
export const apiGetAllPharmacyOrders        = ()               => apiFetch('/api/pharmacy/orders');

// ─── Video Session endpoints ──────────────────────────────────
export const apiStartSession       = (appointmentId) => apiFetch(`/api/session/start/${appointmentId}`, { method: 'POST' });
export const apiEndSession         = (roomId)        => apiFetch(`/api/session/end/${roomId}`,           { method: 'POST' });
export const apiGetSessionStatus   = (appointmentId) => apiFetch(`/api/session/status/${appointmentId}`);
export const apiCheckRoom          = (roomId)        => apiFetch(`/api/session/check/${roomId}`);

// ─── Medical Document endpoints ───────────────────────────────
export const apiGetMyDocuments     = ()              => apiFetch('/api/docs/my');
export const apiDeleteDocument     = (id)            => apiFetch(`/api/docs/${id}`, { method: 'DELETE' });
export const apiGetSessionDocuments = (roomId)       => apiFetch(`/api/docs/session/${roomId}`);
export const apiDocFileUrl         = (id)            => `/api/docs/file/${id}`;

// ─── Prescription & Medication Tracker endpoints ─────────────────────
export const apiIssuePrescription       = (appointmentId, payload) => apiFetch(`/api/prescription/issue/${appointmentId}`, { method: 'POST', body: JSON.stringify(payload) });
export const apiGetMyPrescriptions      = ()                        => apiFetch('/api/prescription/my');
export const apiDeletePrescription     = (id)                      => apiFetch(`/api/prescription/${id}`, { method: 'DELETE' });
export const apiGetPrescriptionByAppt   = (appointmentId)          => apiFetch(`/api/prescription/appointment/${appointmentId}`);
export const apiMarkMedicineTaken       = (payload)                 => apiFetch('/api/prescription/taken', { method: 'POST', body: JSON.stringify(payload) });
export const apiGetMedicineLogs         = ()                        => apiFetch('/api/prescription/logs');
export const apiCreateReminder          = (payload)                 => apiFetch('/api/prescription/reminders', { method: 'POST', body: JSON.stringify(payload) });
export const apiGetReminders             = ()                        => apiFetch('/api/prescription/reminders');
export const apiDeleteReminder          = (id)                      => apiFetch(`/api/prescription/reminders/${id}`, { method: 'DELETE' });
export const apiGetAdherence            = ()                        => apiFetch('/api/prescription/adherence');
export const apiGetDoctorAdherenceAlerts= ()                        => apiFetch('/api/prescription/doctor-alerts');

// ─── Emergency endpoints ──────────────────────────────────────────────
export const apiRaiseEmergency      = (payload)  => apiFetch('/api/emergency/raise',       { method: 'POST', body: JSON.stringify(payload) });
export const apiAcceptEmergency     = (id)       => apiFetch(`/api/emergency/${id}/accept`, { method: 'POST' });
export const apiResolveEmergency    = (id)       => apiFetch(`/api/emergency/${id}/resolve`,{ method: 'POST' });
export const apiCancelEmergency     = (id)       => apiFetch(`/api/emergency/${id}/cancel`, { method: 'POST' });
export const apiGetActiveEmergencies= ()         => apiFetch('/api/emergency/active');
export const apiGetMyEmergencies    = ()         => apiFetch('/api/emergency/my');
export const apiGetAcceptedByMe     = ()         => apiFetch('/api/emergency/accepted');
export const apiGetEmergencyById    = (id)       => apiFetch(`/api/emergency/${id}`);

// ─── Article endpoints ────────────────────────────────────────────────
export const apiCreateArticle   = (payload)              => apiFetch('/api/articles',       { method: 'POST', body: JSON.stringify(payload) });
export const apiUpdateArticle   = (id, payload)          => apiFetch(`/api/articles/${id}`, { method: 'PUT',  body: JSON.stringify(payload) });
export const apiDeleteArticle   = (id)                   => apiFetch(`/api/articles/${id}`, { method: 'DELETE' });
export const apiLikeArticle     = (id)                   => apiFetch(`/api/articles/${id}/like`, { method: 'POST' });
export const apiGetArticles     = (category)             => apiFetch(`/api/articles${category ? `?category=${encodeURIComponent(category)}` : ''}`);
export const apiGetArticle      = (id)                   => apiFetch(`/api/articles/${id}`);
export const apiGetMyArticles   = ()                     => apiFetch('/api/articles/mine');

export const apiChangePassword        = (currentPassword, newPassword) => apiFetch('/api/user/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
export const apiChangeUsername        = (newUsername) => apiFetch('/api/user/change-username', { method: 'POST', body: JSON.stringify({ newUsername }) });

// ─── Lab Center endpoints ─────────────────────────────────────────────
export const apiGetLabOrders          = (status) => apiFetch(`/api/lab/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`);
export const apiGetLabOrderById       = (id) => apiFetch(`/api/lab/orders/${id}`);
export const apiLabScheduleSlot      = (id, payload) => apiFetch(`/api/lab/orders/${id}/schedule-slot`, { method: 'POST', body: JSON.stringify(payload) });
export const apiLabCollectSample      = (id, payload) => apiFetch(`/api/lab/orders/${id}/collect-sample`, { method: 'POST', body: JSON.stringify(payload || {}) });
export const apiLabStartTesting       = (id, payload) => apiFetch(`/api/lab/orders/${id}/start-testing`, { method: 'POST', body: JSON.stringify(payload || {}) });
export const apiLabUploadResults      = (id, payload) => apiFetch(`/api/lab/orders/${id}/upload-results`, { method: 'POST', body: JSON.stringify(payload) });
export const apiLabAutoAnalyze        = (id, payload) => apiFetch(`/api/lab/orders/${id}/auto-analyze`, { method: 'POST', body: JSON.stringify(payload || {}) });
export const apiGetLabStats           = () => apiFetch('/api/lab/stats');

export async function apiLabUploadHardcopy(orderId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const headers = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`/api/lab/orders/${orderId}/upload-hardcopy`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === 'object' ? (body.error || body.message || `HTTP ${res.status}`) : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

// ─── Admin endpoints ──────────────────────────────────────────────────
export const apiAdminGetStats       = ()   => apiFetch('/api/admin/stats');
export const apiAdminGetDoctors     = ()   => apiFetch('/api/admin/doctors');
export const apiAdminCreateDoctor   = (username, password) => apiFetch('/api/admin/create-doctor', { method: 'POST', body: JSON.stringify({ username, password }) });
export const apiAdminDeleteDoctor   = (id) => apiFetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
export const apiAdminGetPharmacies  = ()   => apiFetch('/api/admin/pharmacies');
export const apiAdminCreatePharmacy = (username, password) => apiFetch('/api/admin/create-pharmacy', { method: 'POST', body: JSON.stringify({ username, password }) });
export const apiAdminDeletePharmacy = (id) => apiFetch(`/api/admin/pharmacy/${id}`, { method: 'DELETE' });
export const apiAdminGetLabs        = ()   => apiFetch('/api/admin/labs');
export const apiAdminCreateLab      = (username, password) => apiFetch('/api/admin/create-lab', { method: 'POST', body: JSON.stringify({ username, password }) });
export const apiAdminDeleteLab      = (id) => apiFetch(`/api/admin/labs/${id}`, { method: 'DELETE' });
export const apiAdminGetPatients    = ()   => apiFetch('/api/admin/patients');

/** Upload a file (multipart/form-data) — do NOT set Content-Type header manually */
export async function apiUploadDocument(file, appointmentId) {
  const formData = new FormData();
  formData.append('file', file);
  if (appointmentId) formData.append('appointmentId', appointmentId);

  const headers = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch('/api/docs/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === 'object'
      ? (body.error || body.message || `HTTP ${res.status}`)
      : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

// ─── Formatting helpers ───────────────────────────────────────
export function fmtDate(val) {
  if (!val) return '—';
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { dateStyle: 'medium' });
  }
  return new Date(val).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export function fmtTime(val) {
  if (!val) return '—';
  if (Array.isArray(val)) {
    const [h, m] = val;
    const d = new Date(); d.setHours(h, m, 0);
    return d.toLocaleTimeString('en-IN', { timeStyle: 'short' });
  }
  return val;
}

export function fmtDateTime(val) {
  if (!val) return '—';
  if (Array.isArray(val)) {
    const [y, mo, d, h, mi] = val;
    return new Date(y, mo - 1, d, h, mi).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return new Date(val).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

