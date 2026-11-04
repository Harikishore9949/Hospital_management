package Login.demo.controller;

import Login.demo.entity.*;
import Login.demo.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicalDocumentRepository documentRepository;
    private final VideoSessionRepository sessionRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final ArticleRepository articleRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final Login.demo.service.PatientFacilityService facilityService;

    public AdminController(
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            AppointmentRepository appointmentRepository,
            AvailabilitySlotRepository slotRepository,
            PrescriptionRepository prescriptionRepository,
            MedicalDocumentRepository documentRepository,
            VideoSessionRepository sessionRepository,
            EmergencyAlertRepository emergencyAlertRepository,
            ArticleRepository articleRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
            Login.demo.service.PatientFacilityService facilityService) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.slotRepository = slotRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.documentRepository = documentRepository;
        this.sessionRepository = sessionRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.articleRepository = articleRepository;
        this.passwordEncoder = passwordEncoder;
        this.facilityService = facilityService;
    }

    // ── Guard helper ─────────────────────────────────────────────────────

    private void requireAdmin(Authentication auth) {
        User caller = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied: ADMIN only.");
        }
    }

    // ── Create Doctor Account ─────────────────────────────────────────────

    @PostMapping("/create-doctor")
    public ResponseEntity<User> createDoctor(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        requireAdmin(auth);

        String username = request.get("username");
        String password = request.get("password");

        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("Doctor username / email is required.");
        }
        if (password == null || password.trim().length() < 6) {
            throw new RuntimeException("Default password must be at least 6 characters.");
        }

        String cleanedUsername = username.trim();
        if (userRepository.findByUsername(cleanedUsername).isPresent()) {
            throw new RuntimeException("Username '" + cleanedUsername + "' already exists.");
        }

        User doctor = new User();
        doctor.setUsername(cleanedUsername);
        doctor.setPassword(passwordEncoder.encode(password.trim()));
        doctor.setRole(Role.DOCTOR);
        User savedDoctor = userRepository.save(doctor);

        // Create default doctor profile
        DoctorProfile profile = new DoctorProfile();
        profile.setUser(savedDoctor);
        profile.setFullName("Dr. " + cleanedUsername);
        profile.setSpecialization("General Physician");
        profile.setDepartment("General Medicine");
        doctorProfileRepository.save(profile);

        return ResponseEntity.ok(savedDoctor);
    }

    // ── Create Pharmacy Account ───────────────────────────────────────────

    @PostMapping("/create-pharmacy")
    public ResponseEntity<User> createPharmacy(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        requireAdmin(auth);

        String username = request.get("username");
        String password = request.get("password");

        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("Pharmacy username / email is required.");
        }
        if (password == null || password.trim().length() < 6) {
            throw new RuntimeException("Default password must be at least 6 characters.");
        }

        String cleanedUsername = username.trim();
        if (userRepository.findByUsername(cleanedUsername).isPresent()) {
            throw new RuntimeException("Username '" + cleanedUsername + "' already exists.");
        }

        User pharma = new User();
        pharma.setUsername(cleanedUsername);
        pharma.setPassword(passwordEncoder.encode(password.trim()));
        pharma.setRole(Role.PHARMACY);
        User savedPharma = userRepository.save(pharma);

        return ResponseEntity.ok(savedPharma);
    }

    // ── List all doctors ──────────────────────────────────────────────────

    @GetMapping("/doctors")
    public List<User> getAllDoctors(Authentication auth) {
        requireAdmin(auth);
        return userRepository.findByRole(Role.DOCTOR);
    }

    // ── List all pharmacy users ───────────────────────────────────────────

    @GetMapping("/pharmacies")
    public List<User> getAllPharmacies(Authentication auth) {
        requireAdmin(auth);
        return userRepository.findByRole(Role.PHARMACY);
    }

    // ── Create a new Lab Center account ───────────────────────────────────

    @PostMapping("/create-lab")
    @Transactional
    public ResponseEntity<User> createLab(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        requireAdmin(auth);

        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank()) {
            throw new RuntimeException("Username is required.");
        }
        if (password == null || password.trim().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }

        String cleanedUsername = username.trim().toLowerCase();
        if (userRepository.findByUsername(cleanedUsername).isPresent()) {
            throw new RuntimeException("Username '" + cleanedUsername + "' already exists.");
        }

        User lab = new User();
        lab.setUsername(cleanedUsername);
        lab.setPassword(passwordEncoder.encode(password.trim()));
        lab.setRole(Role.LAB);
        User savedLab = userRepository.save(lab);

        return ResponseEntity.ok(savedLab);
    }

    // ── List all Lab Center users ─────────────────────────────────────────

    @GetMapping("/labs")
    public List<User> getAllLabs(Authentication auth) {
        requireAdmin(auth);
        return userRepository.findByRole(Role.LAB);
    }

    // ── Delete a Lab Center ───────────────────────────────────────────────

    @DeleteMapping("/labs/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteLab(
            @PathVariable Integer id,
            Authentication auth) {
        requireAdmin(auth);

        User lab = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab Center not found."));

        if (lab.getRole() != Role.LAB) {
            throw new RuntimeException("User is not a Lab Center.");
        }

        userRepository.delete(lab);

        return ResponseEntity.ok(Map.of("message", "Lab Center '" + lab.getUsername() + "' deleted successfully."));
    }

    // ── Dashboard stats ───────────────────────────────────────────────────

    @GetMapping("/stats")
    public Map<String, Long> getStats(Authentication auth) {
        requireAdmin(auth);
        return Map.of(
                "doctors",    userRepository.countByRole(Role.DOCTOR),
                "patients",   userRepository.countByRole(Role.PATIENT),
                "pharmacies", userRepository.countByRole(Role.PHARMACY),
                "labs",       userRepository.countByRole(Role.LAB),
                "appointments", appointmentRepository.count(),
                "articles",   articleRepository.count(),
                "emergencies", emergencyAlertRepository.countByStatus("OPEN")
        );
    }

    // ── Delete a doctor completely ─────────────────────────────────────────

    @DeleteMapping("/doctors/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteDoctor(
            @PathVariable Integer id,
            Authentication auth) {
        requireAdmin(auth);

        User doctor = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found."));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("User is not a doctor.");
        }

        // 1. Delete articles
        articleRepository.deleteAll(articleRepository.findByDoctorOrderByPublishedAtDesc(doctor));

        // 2. Delete emergency alerts accepted by this doctor
        List<EmergencyAlert> alerts = emergencyAlertRepository.findByAcceptedByOrderByCreatedAtDesc(doctor);
        alerts.forEach(a -> { a.setAcceptedBy(null); emergencyAlertRepository.save(a); });

        // 3. Delete availability slots
        slotRepository.deleteAll(slotRepository.findByDoctor(doctor));

        // 4. Get all appointments for this doctor and cascade
        List<Appointment> appts = appointmentRepository.findByDoctor(doctor);
        for (Appointment appt : appts) {
            // Delete prescriptions
            prescriptionRepository.findByAppointment(appt).ifPresent(prescriptionRepository::delete);
            // Delete documents
            documentRepository.deleteAll(documentRepository.findByAppointment(appt));
            // Delete video session
            sessionRepository.findByAppointment_Id(appt.getId()).ifPresent(sessionRepository::delete);
        }
        appointmentRepository.deleteAll(appts);

        // 5. Delete doctor profile
        doctorProfileRepository.findByUser(doctor).ifPresent(doctorProfileRepository::delete);

        // 6. Delete the user
        userRepository.delete(doctor);

        return ResponseEntity.ok(Map.of("message", "Doctor '" + doctor.getUsername() + "' deleted successfully."));
    }

    // ── Delete a pharmacy user completely ─────────────────────────────────

    @DeleteMapping("/pharmacy/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> deletePharmacy(
            @PathVariable Integer id,
            Authentication auth) {
        requireAdmin(auth);

        User pharma = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pharmacy staff not found."));

        if (pharma.getRole() != Role.PHARMACY) {
            throw new RuntimeException("User is not a pharmacy staff member.");
        }

        userRepository.delete(pharma);

        return ResponseEntity.ok(Map.of("message", "Pharmacy user '" + pharma.getUsername() + "' deleted successfully."));
    }

    // ── List all patients ─────────────────────────────────────────────────

    @GetMapping("/patients")
    public List<User> getAllPatients(Authentication auth) {
        requireAdmin(auth);
        return userRepository.findByRole(Role.PATIENT);
    }

    // ── Hospital Beds & Inpatient Facility Operations ──────────────────────

    @GetMapping("/hospital-facilities/beds")
    public Map<String, Object> getHospitalBeds(Authentication auth) {
        requireAdmin(auth);
        return facilityService.getLiveHospitalBeds();
    }

    @GetMapping("/hospital-facilities/bed-requests")
    public List<BedBookingRequest> getAllBedRequests(Authentication auth) {
        requireAdmin(auth);
        return facilityService.getAllBedRequests();
    }

    @PostMapping("/hospital-facilities/bed-requests/{id}/accept")
    public BedBookingRequest acceptBedRequest(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        requireAdmin(auth);
        String notes = body != null ? body.get("adminNotes") : "Accepted by Admin";
        return facilityService.acceptBedRequest(id, notes);
    }

    @PostMapping("/hospital-facilities/bed-requests/{id}/reject")
    public BedBookingRequest rejectBedRequest(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        requireAdmin(auth);
        String notes = body != null ? body.get("adminNotes") : "Rejected by Admin";
        return facilityService.rejectBedRequest(id, notes);
    }

    @PostMapping("/hospital-facilities/beds/update-status")
    public ResponseEntity<Map<String, Object>> updateBedStatus(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        requireAdmin(auth);
        String wardCode = body.get("wardCode");
        String bedNo = body.get("bedNo");
        String status = body.get("status");
        String patientCode = body.get("patientCode");

        if (wardCode == null || bedNo == null || status == null) {
            throw new RuntimeException("wardCode, bedNo, and status are required");
        }

        facilityService.updateBedStatus(wardCode, bedNo, status, patientCode);
        return ResponseEntity.ok(Map.of("message", "Bed status updated successfully", "beds", facilityService.getLiveHospitalBeds()));
    }
}
