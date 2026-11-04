package Login.demo.service;

import Login.demo.entity.BedBookingRequest;
import Login.demo.entity.HospitalBed;
import Login.demo.entity.LabTestOrder;
import Login.demo.entity.PatientVital;
import Login.demo.entity.User;
import Login.demo.repository.BedBookingRequestRepository;
import Login.demo.repository.HospitalBedRepository;
import Login.demo.repository.LabTestOrderRepository;
import Login.demo.repository.PatientVitalRepository;
import Login.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class PatientFacilityService {

    private final PatientVitalRepository vitalRepository;
    private final LabTestOrderRepository labTestOrderRepository;
    private final UserRepository userRepository;
    private final LabService labService;
    private final BedBookingRequestRepository bedBookingRequestRepository;
    private final HospitalBedRepository hospitalBedRepository;

    public PatientFacilityService(
            PatientVitalRepository vitalRepository,
            LabTestOrderRepository labTestOrderRepository,
            UserRepository userRepository,
            LabService labService,
            BedBookingRequestRepository bedBookingRequestRepository,
            HospitalBedRepository hospitalBedRepository) {
        this.vitalRepository = vitalRepository;
        this.labTestOrderRepository = labTestOrderRepository;
        this.userRepository = userRepository;
        this.labService = labService;
        this.bedBookingRequestRepository = bedBookingRequestRepository;
        this.hospitalBedRepository = hospitalBedRepository;
        initializeWards();
    }

    private synchronized void initializeWards() {
        if (hospitalBedRepository.count() > 0) return;

        List<HospitalBed> beds = new ArrayList<>();
        // Intensive Care Unit (ICU)
        beds.add(new HospitalBed("Intensive Care Unit (ICU)", "ICU", "3rd Floor - Critical Care Block", "1:1 Dedicated", "ICU-01", "OCCUPIED", "PT-842", true, 1));
        beds.add(new HospitalBed("Intensive Care Unit (ICU)", "ICU", "3rd Floor - Critical Care Block", "1:1 Dedicated", "ICU-02", "OCCUPIED", "PT-903", true, 2));
        beds.add(new HospitalBed("Intensive Care Unit (ICU)", "ICU", "3rd Floor - Critical Care Block", "1:1 Dedicated", "ICU-03", "AVAILABLE", "—", true, 3));
        beds.add(new HospitalBed("Intensive Care Unit (ICU)", "ICU", "3rd Floor - Critical Care Block", "1:1 Dedicated", "ICU-04", "AVAILABLE", "—", true, 4));
        beds.add(new HospitalBed("Intensive Care Unit (ICU)", "ICU", "3rd Floor - Critical Care Block", "1:1 Dedicated", "ICU-05", "OCCUPIED", "PT-112", false, 5));
        beds.add(new HospitalBed("Intensive Care Unit (ICU)", "ICU", "3rd Floor - Critical Care Block", "1:1 Dedicated", "ICU-06", "MAINTENANCE", "Sanitizing", false, 6));

        // Emergency & Trauma Center (EMERGENCY)
        beds.add(new HospitalBed("Emergency & Trauma Center", "EMERGENCY", "Ground Floor - Rapid Response Wing", "1:2 Rapid", "EMG-01", "OCCUPIED", "PT-331", true, 1));
        beds.add(new HospitalBed("Emergency & Trauma Center", "EMERGENCY", "Ground Floor - Rapid Response Wing", "1:2 Rapid", "EMG-02", "AVAILABLE", "—", true, 2));
        beds.add(new HospitalBed("Emergency & Trauma Center", "EMERGENCY", "Ground Floor - Rapid Response Wing", "1:2 Rapid", "EMG-03", "AVAILABLE", "—", false, 3));
        beds.add(new HospitalBed("Emergency & Trauma Center", "EMERGENCY", "Ground Floor - Rapid Response Wing", "1:2 Rapid", "EMG-04", "OCCUPIED", "PT-422", false, 4));
        beds.add(new HospitalBed("Emergency & Trauma Center", "EMERGENCY", "Ground Floor - Rapid Response Wing", "1:2 Rapid", "EMG-05", "AVAILABLE", "—", false, 5));

        // General Medical Ward A (Male) (GEN-A)
        beds.add(new HospitalBed("General Medical Ward A (Male)", "GEN-A", "1st Floor - East Wing", "1:4 Standard", "GA-101", "AVAILABLE", "—", false, 1));
        beds.add(new HospitalBed("General Medical Ward A (Male)", "GEN-A", "1st Floor - East Wing", "1:4 Standard", "GA-102", "OCCUPIED", "PT-541", false, 2));
        beds.add(new HospitalBed("General Medical Ward A (Male)", "GEN-A", "1st Floor - East Wing", "1:4 Standard", "GA-103", "AVAILABLE", "—", false, 3));
        beds.add(new HospitalBed("General Medical Ward A (Male)", "GEN-A", "1st Floor - East Wing", "1:4 Standard", "GA-104", "OCCUPIED", "PT-209", false, 4));

        // General Medical Ward B (Female) (GEN-B)
        beds.add(new HospitalBed("General Medical Ward B (Female)", "GEN-B", "1st Floor - West Wing", "1:4 Standard", "GB-201", "OCCUPIED", "PT-611", false, 1));
        beds.add(new HospitalBed("General Medical Ward B (Female)", "GEN-B", "1st Floor - West Wing", "1:4 Standard", "GB-202", "AVAILABLE", "—", false, 2));
        beds.add(new HospitalBed("General Medical Ward B (Female)", "GEN-B", "1st Floor - West Wing", "1:4 Standard", "GB-203", "AVAILABLE", "—", false, 3));

        // Cardiac Care Unit (CCU) (CCU)
        beds.add(new HospitalBed("Cardiac Care Unit (CCU)", "CCU", "4th Floor - Cardiology Block", "1:1 Dedicated", "CCU-01", "AVAILABLE", "—", true, 1));
        beds.add(new HospitalBed("Cardiac Care Unit (CCU)", "CCU", "4th Floor - Cardiology Block", "1:1 Dedicated", "CCU-02", "OCCUPIED", "PT-772", true, 2));
        beds.add(new HospitalBed("Cardiac Care Unit (CCU)", "CCU", "4th Floor - Cardiology Block", "1:1 Dedicated", "CCU-03", "AVAILABLE", "—", true, 3));

        // Deluxe Private Suites (SUITE)
        beds.add(new HospitalBed("Deluxe Private Suites", "SUITE", "5th Floor - Premium Care", "1:1 Dedicated Attendant", "STE-501", "AVAILABLE", "—", false, 1));
        beds.add(new HospitalBed("Deluxe Private Suites", "SUITE", "5th Floor - Premium Care", "1:1 Dedicated Attendant", "STE-502", "AVAILABLE", "—", false, 2));
        beds.add(new HospitalBed("Deluxe Private Suites", "SUITE", "5th Floor - Premium Care", "1:1 Dedicated Attendant", "STE-503", "OCCUPIED", "PT-104", true, 3));
        beds.add(new HospitalBed("Deluxe Private Suites", "SUITE", "5th Floor - Premium Care", "1:1 Dedicated Attendant", "STE-504", "MAINTENANCE", "Sanitizing", false, 4));

        hospitalBedRepository.saveAll(beds);
    }

    private User findPatient(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient user not found"));
    }

    // ── Vitals Management ───────────────────────────────────────────────────

    public PatientVital recordVitals(String username, PatientVital vital) {
        User patient = findPatient(username);
        vital.setPatient(patient);
        vital.setRecordedAt(LocalDateTime.now());

        if (vital.getWeight() != null && vital.getHeight() != null && vital.getHeight() > 0) {
            double hMeters = vital.getHeight() / 100.0;
            double bmi = vital.getWeight() / (hMeters * hMeters);
            vital.setBmi(Math.round(bmi * 10.0) / 10.0);
        }

        String status = "NORMAL";
        if (vital.getSystolic() != null && vital.getDiastolic() != null) {
            if (vital.getSystolic() >= 140 || vital.getDiastolic() >= 90) {
                status = "ATTENTION_REQUIRED";
            } else if (vital.getSystolic() >= 120 || vital.getDiastolic() >= 80) {
                status = "ELEVATED";
            }
        }
        if (vital.getBloodSugar() != null && vital.getBloodSugar() > 140) {
            status = "ATTENTION_REQUIRED";
        }
        if (vital.getSpo2() != null && vital.getSpo2() < 94) {
            status = "ATTENTION_REQUIRED";
        }
        vital.setStatusCategory(status);

        return vitalRepository.save(vital);
    }

    public List<PatientVital> getPatientVitals(String username) {
        User patient = findPatient(username);
        return vitalRepository.findByPatientOrderByRecordedAtDesc(patient);
    }

    public void deleteVital(String username, Integer id) {
        User patient = findPatient(username);
        PatientVital vital = vitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vital record not found"));
        if (!vital.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Access denied");
        }
        vitalRepository.delete(vital);
    }

    // ── Lab Diagnostics ─────────────────────────────────────────────────────

    public List<Map<String, Object>> getLabCatalog() {
        return labService.getLabCatalog();
    }

    public LabTestOrder bookLabTest(String username, LabTestOrder req) {
        User patient = findPatient(username);
        req.setPatient(patient);
        req.setBookedAt(LocalDateTime.now());
        if (req.getScheduledDate() == null) {
            req.setScheduledDate(LocalDate.now());
        }
        if (req.getStatus() == null || req.getStatus().isBlank()) {
            req.setStatus("SAMPLE_PENDING");
        }
        if (req.getTransactionId() == null) {
            req.setTransactionId("TXN-LAB-" + System.currentTimeMillis());
        }
        req.setPaymentStatus("PAID");
        if (req.getLabCenterName() == null || req.getLabCenterName().isBlank()) {
            req.setLabCenterName("Central Diagnostics & Pathology");
        }

        return labTestOrderRepository.save(req);
    }

    public List<LabTestOrder> getMyLabOrders(String username) {
        User patient = findPatient(username);
        return labTestOrderRepository.findByPatientOrderByBookedAtDesc(patient);
    }

    // ── Live Bed & Ward Occupancy Tracker (Database-backed & Persistent) ───

    public Map<String, Object> getLiveHospitalBeds() {
        List<HospitalBed> allBeds = hospitalBedRepository.findAllByOrderByDisplayOrderAscIdAsc();
        if (allBeds.isEmpty()) {
            initializeWards();
            allBeds = hospitalBedRepository.findAllByOrderByDisplayOrderAscIdAsc();
        }

        // Group beds by wardCode preserving encounter order
        Map<String, List<HospitalBed>> bedsByWard = new LinkedHashMap<>();
        for (HospitalBed b : allBeds) {
            bedsByWard.computeIfAbsent(b.getWardCode(), k -> new ArrayList<>()).add(b);
        }

        List<Map<String, Object>> wards = new ArrayList<>();
        int totalAll = 0;
        int occupiedAll = 0;
        int availableAll = 0;

        for (Map.Entry<String, List<HospitalBed>> entry : bedsByWard.entrySet()) {
            List<HospitalBed> wardBeds = entry.getValue();
            HospitalBed first = wardBeds.get(0);

            int totalWard = wardBeds.size();
            int occupiedWard = (int) wardBeds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus())).count();
            int availableWard = (int) wardBeds.stream().filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus())).count();
            int ventsWard = (int) wardBeds.stream().filter(b -> Boolean.TRUE.equals(b.getVentilatorEquipped()) && "AVAILABLE".equalsIgnoreCase(b.getStatus())).count();

            totalAll += totalWard;
            occupiedAll += occupiedWard;
            availableAll += availableWard;

            List<Map<String, Object>> bedList = new ArrayList<>();
            for (HospitalBed b : wardBeds) {
                Map<String, Object> bedMap = new LinkedHashMap<>();
                bedMap.put("id", b.getId());
                bedMap.put("bedNo", b.getBedNo());
                bedMap.put("status", b.getStatus());
                bedMap.put("patientCode", b.getPatientCode());
                bedMap.put("ventilatorEquipped", b.getVentilatorEquipped());
                bedList.add(bedMap);
            }

            Map<String, Object> wardMap = new LinkedHashMap<>();
            wardMap.put("wardName", first.getWardName());
            wardMap.put("code", first.getWardCode());
            wardMap.put("floor", first.getFloor());
            wardMap.put("totalBeds", totalWard);
            wardMap.put("occupied", occupiedWard);
            wardMap.put("available", availableWard);
            wardMap.put("ventilatorsAvailable", ventsWard);
            wardMap.put("nurseRatio", first.getNurseRatio());
            wardMap.put("beds", bedList);
            wards.add(wardMap);
        }

        int occupancyRate = totalAll > 0 ? (int) Math.round(((double) occupiedAll / totalAll) * 100) : 0;
        long pendingRequestsCount = bedBookingRequestRepository.findByStatusOrderByRequestedAtDesc("PENDING").size();

        return Map.of(
                "totalBeds", totalAll,
                "occupiedBeds", occupiedAll,
                "availableBeds", availableAll,
                "occupancyRate", occupancyRate,
                "pendingRequests", pendingRequestsCount,
                "lastUpdated", LocalDateTime.now().toString(),
                "wards", wards
        );
    }

    // ── Bed Booking Requests (Patient -> Admin) ─────────────────────────────

    public BedBookingRequest createBedBookingRequest(
            String username,
            String wardCode,
            String wardName,
            String bedNo,
            String patientName,
            String contactPhone,
            String urgency,
            String notes) {
        User patient = findPatient(username);

        BedBookingRequest req = new BedBookingRequest();
        req.setPatient(patient);
        req.setPatientName(patientName != null && !patientName.isBlank() ? patientName.trim() : username);
        req.setContactPhone(contactPhone != null ? contactPhone.trim() : "");
        req.setWardCode(wardCode);
        req.setWardName(wardName != null && !wardName.isBlank() ? wardName : wardCode);
        req.setBedNo(bedNo != null && !bedNo.isBlank() ? bedNo.trim() : "Any Available");
        req.setUrgency(urgency != null ? urgency.toUpperCase() : "HIGH");
        req.setNotes(notes);
        req.setStatus("PENDING");
        req.setRequestedAt(LocalDateTime.now());

        return bedBookingRequestRepository.save(req);
    }

    public List<BedBookingRequest> getPatientBedRequests(String username) {
        User patient = findPatient(username);
        return bedBookingRequestRepository.findByPatientOrderByRequestedAtDesc(patient);
    }

    public List<BedBookingRequest> getAllBedRequests() {
        return bedBookingRequestRepository.findAllByOrderByRequestedAtDesc();
    }

    public BedBookingRequest acceptBedRequest(Integer requestId, String adminNotes) {
        BedBookingRequest req = bedBookingRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Bed request not found: " + requestId));
        req.setStatus("ACCEPTED");
        req.setAdminNotes(adminNotes != null ? adminNotes : "Bed allocated and confirmed by Hospital Admin.");
        req.setProcessedAt(LocalDateTime.now());

        // Allocate and occupy bed in database
        String wardCode = req.getWardCode();
        HospitalBed allocatedBed = null;
        if (req.getBedNo() != null && !req.getBedNo().isBlank() && !"Any Available".equalsIgnoreCase(req.getBedNo())) {
            allocatedBed = hospitalBedRepository.findByWardCodeAndBedNo(wardCode, req.getBedNo())
                    .or(() -> hospitalBedRepository.findByBedNo(req.getBedNo()))
                    .orElse(null);
        }

        // If specific bed not found or not available, find any AVAILABLE bed in this ward
        if (allocatedBed == null || !"AVAILABLE".equalsIgnoreCase(allocatedBed.getStatus())) {
            List<HospitalBed> wardBeds = hospitalBedRepository.findByWardCodeOrderByDisplayOrderAscIdAsc(wardCode);
            for (HospitalBed b : wardBeds) {
                if ("AVAILABLE".equalsIgnoreCase(b.getStatus())) {
                    allocatedBed = b;
                    break;
                }
            }
        }

        if (allocatedBed != null) {
            allocatedBed.setStatus("OCCUPIED");
            allocatedBed.setPatientCode(req.getPatientName() + " (PT-" + req.getPatient().getId() + ")");
            allocatedBed.setUpdatedAt(LocalDateTime.now());
            hospitalBedRepository.save(allocatedBed);
            req.setBedNo(allocatedBed.getBedNo());
        }

        return bedBookingRequestRepository.save(req);
    }

    public BedBookingRequest rejectBedRequest(Integer requestId, String adminNotes) {
        BedBookingRequest req = bedBookingRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Bed request not found: " + requestId));
        req.setStatus("REJECTED");
        req.setAdminNotes(adminNotes != null ? adminNotes : "Bed request declined by Hospital Admin (Ward currently at peak capacity).");
        req.setProcessedAt(LocalDateTime.now());
        return bedBookingRequestRepository.save(req);
    }

    public synchronized void updateBedStatus(String wardCode, String bedNo, String newStatus, String patientCode) {
        HospitalBed bed = hospitalBedRepository.findByWardCodeAndBedNo(wardCode, bedNo)
                .or(() -> hospitalBedRepository.findByBedNo(bedNo))
                .orElseThrow(() -> new RuntimeException("Bed " + bedNo + " not found in ward " + wardCode));

        String upperStatus = newStatus.toUpperCase();
        bed.setStatus(upperStatus);
        if ("AVAILABLE".equalsIgnoreCase(upperStatus)) {
            bed.setPatientCode("—");
        } else if ("MAINTENANCE".equalsIgnoreCase(upperStatus)) {
            bed.setPatientCode(patientCode != null && !patientCode.isBlank() ? patientCode : "Sanitizing");
        } else if ("OCCUPIED".equalsIgnoreCase(upperStatus)) {
            bed.setPatientCode(patientCode != null && !patientCode.isBlank() ? patientCode : "ADM-INPATIENT");
        } else {
            bed.setPatientCode(patientCode != null ? patientCode : "—");
        }
        bed.setUpdatedAt(LocalDateTime.now());
        hospitalBedRepository.save(bed);
    }

    // ── Live Ambulance Dispatch Simulation ──────────────────────────────────

    public Map<String, Object> getAmbulanceLiveStatus(String username) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ambulanceId", "AMB-108-MH02");
        res.put("vehicleModel", "Force Traveller ICU Advanced Life Support (ALS)");
        res.put("status", "EN_ROUTE");
        res.put("etaMinutes", 6);
        res.put("driverName", "Rajesh Sharma (Paramedic Certified)");
        res.put("driverPhone", "+91 98765 43210");
        res.put("equipmentOnboard", List.of("Transport Ventilator", "Defibrillator", "Oxygen Supply", "ECG Monitor", "IV Infusion Pump"));
        res.put("hospitalBase", "MediCare Central Emergency Dispatch Wing");
        res.put("currentSpeed", "54 km/h");
        res.put("liveGps", Map.of("lat", 19.0760, "lng", 72.8777, "heading", "South-West"));
        res.put("timeline", List.of(
                Map.of("step", "Emergency Alert Confirmed", "time", "13:02 PM", "done", true),
                Map.of("step", "Ambulance ALS Dispatched", "time", "13:04 PM", "done", true),
                Map.of("step", "Paramedic En Route to Patient Location", "time", "Now (ETA 6m)", "current", true),
                Map.of("step", "Patient Stabilization & Triage", "time", "Pending", "done", false),
                Map.of("step", "Transit to MediCare Emergency Center", "time", "Pending", "done", false)
        ));
        return res;
    }
}
