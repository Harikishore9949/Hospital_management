package Login.demo.controller;

import Login.demo.dto.AppointmentRequest;
import Login.demo.dto.PatientProfileRequest;
import Login.demo.entity.*;
import Login.demo.repository.DoctorProfileRepository;
import Login.demo.repository.PatientProfileRepository;
import Login.demo.repository.UserRepository;
import Login.demo.service.AppointmentService;
import Login.demo.service.DoctorService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;
    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final Login.demo.service.PatientFacilityService facilityService;
    private final PatientProfileRepository patientProfileRepository;

    public PatientController(
            DoctorService doctorService,
            AppointmentService appointmentService,
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            Login.demo.service.PatientFacilityService facilityService,
            PatientProfileRepository patientProfileRepository) {

        this.doctorService = doctorService;
        this.appointmentService = appointmentService;
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.facilityService = facilityService;
        this.patientProfileRepository = patientProfileRepository;
    }

    /**
     * Returns all doctors enriched with their profile data.
     * Each element is a DoctorProfile (which embeds a User).
     * If a doctor has not yet created a profile, a shell object
     * is returned with only the user field populated.
     */
    @GetMapping("/doctors")
    public List<DoctorProfile> getAllDoctorsWithProfiles() {
        return userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == Role.DOCTOR)
                .map(doctor -> doctorProfileRepository.findByUser(doctor)
                        .orElseGet(() -> {
                            DoctorProfile shell = new DoctorProfile();
                            shell.setUser(doctor);
                            return shell;
                        }))
                .collect(Collectors.toList());
    }

    // Get available slots for a specific doctor
    @GetMapping("/doctors/{doctorId}/availability")
    public List<AvailabilitySlot> getAvailableSlots(
            @PathVariable Integer doctorId) {
        return doctorService.getAvailableSlots(doctorId);
    }

    // Get a doctor's public profile
    @GetMapping("/doctors/{doctorId}/profile")
    public DoctorProfile getDoctorProfile(@PathVariable Integer doctorId) {
        return doctorService.getProfileByDoctorId(doctorId);
    }

    // Like a doctor
    @PostMapping("/doctors/{doctorId}/like")
    public DoctorProfile likeDoctor(@PathVariable Integer doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));
        DoctorProfile profile = doctorProfileRepository.findByUser(doctor)
                .orElseGet(() -> {
                    DoctorProfile p = new DoctorProfile();
                    p.setUser(doctor);
                    p.setFullName(doctor.getUsername());
                    return p;
                });
        profile.setLikesCount(profile.getLikesCount() + 1);
        return doctorProfileRepository.save(profile);
    }

    // Book an appointment
    @PostMapping("/appointments")
    public Appointment bookAppointment(
            @RequestBody AppointmentRequest request,
            Authentication authentication) {
        return appointmentService.bookAppointment(authentication.getName(), request);
    }

    // Get patient's own appointments
    @GetMapping("/appointments/my")
    public List<Appointment> getMyAppointments(Authentication authentication) {
        return appointmentService.getMyAppointments(authentication.getName());
    }

    // Cancel appointment & free availability slot
    @PostMapping("/appointments/{id}/cancel")
    public Appointment cancelAppointment(
            @PathVariable Integer id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        String reason = body != null ? body.get("reason") : "Cancelled by patient";
        return appointmentService.cancelAppointment(authentication.getName(), id, reason);
    }

    // Reschedule appointment to another slot
    @PostMapping("/appointments/{id}/reschedule")
    public Appointment rescheduleAppointment(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, Integer> body,
            Authentication authentication) {
        Integer newSlotId = body.get("newSlotId");
        if (newSlotId == null) throw new RuntimeException("New slot ID is required");
        return appointmentService.rescheduleAppointment(authentication.getName(), id, newSlotId);
    }

    // Pay appointment consultation fee
    @PostMapping("/appointments/{id}/pay")
    public Appointment payAppointment(
            @PathVariable Integer id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        String txId = body != null ? body.get("transactionId") : null;
        return appointmentService.payAppointment(authentication.getName(), id, txId);
    }

    // ── Vitals Management ───────────────────────────────────────────────────

    @PostMapping("/vitals")
    public Login.demo.entity.PatientVital recordVitals(
            @RequestBody Login.demo.entity.PatientVital vital,
            Authentication authentication) {
        return facilityService.recordVitals(authentication.getName(), vital);
    }

    @GetMapping("/vitals")
    public List<Login.demo.entity.PatientVital> getVitals(Authentication authentication) {
        return facilityService.getPatientVitals(authentication.getName());
    }

    @DeleteMapping("/vitals/{id}")
    public java.util.Map<String, String> deleteVital(
            @PathVariable Integer id,
            Authentication authentication) {
        facilityService.deleteVital(authentication.getName(), id);
        return java.util.Map.of("message", "Vital record deleted successfully");
    }

    // ── Lab Diagnostics ─────────────────────────────────────────────────────

    @GetMapping("/lab-tests/catalog")
    public List<java.util.Map<String, Object>> getLabCatalog() {
        return facilityService.getLabCatalog();
    }

    @PostMapping("/lab-tests")
    public Login.demo.entity.LabTestOrder bookLabTest(
            @RequestBody Login.demo.entity.LabTestOrder order,
            Authentication authentication) {
        return facilityService.bookLabTest(authentication.getName(), order);
    }

    @GetMapping("/lab-tests/my")
    public List<Login.demo.entity.LabTestOrder> getMyLabOrders(Authentication authentication) {
        return facilityService.getMyLabOrders(authentication.getName());
    }

    // ── Hospital Beds & Ambulance Dispatch ──────────────────────────────────

    @GetMapping("/hospital-facilities/beds")
    public java.util.Map<String, Object> getLiveHospitalBeds() {
        return facilityService.getLiveHospitalBeds();
    }

    @PostMapping("/hospital-facilities/book-bed")
    public BedBookingRequest bookBed(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String wardCode = body.get("wardCode");
        String wardName = body.get("wardName");
        String bedNo = body.get("bedNo");
        String patientName = body.get("patientName");
        String contactPhone = body.get("contactPhone");
        String urgency = body.get("urgency");
        String notes = body.get("notes");

        return facilityService.createBedBookingRequest(
                authentication.getName(), wardCode, wardName, bedNo, patientName, contactPhone, urgency, notes
        );
    }

    @GetMapping("/hospital-facilities/my-bed-requests")
    public List<BedBookingRequest> getMyBedRequests(Authentication authentication) {
        return facilityService.getPatientBedRequests(authentication.getName());
    }

    @GetMapping("/hospital-facilities/ambulance")
    public java.util.Map<String, Object> getAmbulanceLiveStatus(Authentication authentication) {
        return facilityService.getAmbulanceLiveStatus(authentication.getName());
    }

    // ── Patient Profile Management ──────────────────────────────────────────

    @GetMapping("/profile")
    public PatientProfile getProfile(Authentication authentication) {
        User patient = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Patient user not found"));
        return patientProfileRepository.findByUser(patient)
                .orElseGet(() -> {
                    PatientProfile p = new PatientProfile();
                    p.setUser(patient);
                    p.setFullName(patient.getUsername());
                    return p;
                });
    }

    @PutMapping("/profile")
    public PatientProfile updateProfile(
            @RequestBody PatientProfileRequest req,
            Authentication authentication) {
        User patient = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Patient user not found"));
        PatientProfile profile = patientProfileRepository.findByUser(patient)
                .orElseGet(() -> {
                    PatientProfile p = new PatientProfile();
                    p.setUser(patient);
                    return p;
                });

        if (req.getFullName() != null) profile.setFullName(req.getFullName().trim());
        if (req.getEmail() != null) profile.setEmail(req.getEmail().trim());
        if (req.getPhoneNumber() != null) profile.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getAge() != null) profile.setAge(req.getAge());
        if (req.getGender() != null) profile.setGender(req.getGender());
        if (req.getBloodGroup() != null) profile.setBloodGroup(req.getBloodGroup());
        if (req.getEmergencyContactName() != null) profile.setEmergencyContactName(req.getEmergencyContactName().trim());
        if (req.getEmergencyContactPhone() != null) profile.setEmergencyContactPhone(req.getEmergencyContactPhone().trim());
        if (req.getAddress() != null) profile.setAddress(req.getAddress().trim());
        if (req.getMedicalHistory() != null) profile.setMedicalHistory(req.getMedicalHistory().trim());
        if (req.getAllergies() != null) profile.setAllergies(req.getAllergies().trim());
        profile.setUpdatedAt(LocalDateTime.now());

        return patientProfileRepository.save(profile);
    }

    @ExceptionHandler(Exception.class)
    public org.springframework.http.ResponseEntity<?> handleException(Exception e) {
        return org.springframework.http.ResponseEntity.badRequest()
                .body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Error processing request"));
    }
}