package Login.demo.service;

import Login.demo.dto.AvailabilityRequest;
import Login.demo.dto.DoctorProfileRequest;
import Login.demo.entity.*;
import Login.demo.repository.AppointmentRepository;
import Login.demo.repository.AvailabilitySlotRepository;
import Login.demo.repository.DoctorProfileRepository;
import Login.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class DoctorService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentService appointmentService;

    public DoctorService(
            AvailabilitySlotRepository availabilitySlotRepository,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            DoctorProfileRepository doctorProfileRepository,
            @org.springframework.context.annotation.Lazy AppointmentService appointmentService) {

        this.availabilitySlotRepository = availabilitySlotRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.appointmentService = appointmentService;
    }

    // ── Get doctor's own profile (empty shell if not yet created) ─────
    public DoctorProfile getMyProfile(String username) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return doctorProfileRepository.findByUser(doctor)
                .orElseGet(() -> {
                    DoctorProfile empty = new DoctorProfile();
                    empty.setUser(doctor);
                    return empty;
                });
    }

    // ── Create or update a doctor's profile ───────────────────────────
    public DoctorProfile saveProfile(String username, DoctorProfileRequest req) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Only doctors can update a doctor profile");
        }
        DoctorProfile profile = doctorProfileRepository.findByUser(doctor)
                .orElseGet(() -> {
                    DoctorProfile p = new DoctorProfile();
                    p.setUser(doctor);
                    return p;
                });
        profile.setFullName(req.getFullName());
        profile.setAge(req.getAge());
        profile.setDepartment(req.getDepartment());
        profile.setSpecialization(req.getSpecialization());
        profile.setEducationBackground(req.getEducationBackground());
        profile.setDegrees(req.getDegrees());
        profile.setExperienceSummary(req.getExperienceSummary());
        profile.setMemberships(req.getMemberships());
        profile.setAwards(req.getAwards());
        profile.setAdditionalNotes(req.getAdditionalNotes());
        if (req.getPhotoBase64() != null) profile.setPhotoBase64(req.getPhotoBase64());
        return doctorProfileRepository.save(profile);
    }

    // ── Get a doctor's profile by userId (patient view) ───────────────
    public DoctorProfile getProfileByDoctorId(Integer doctorId) {
        return doctorProfileRepository.findByUserId(doctorId)
                .orElseGet(() -> {
                    User doctor = userRepository.findById(doctorId)
                            .orElseThrow(() -> new RuntimeException("Doctor not found"));
                    DoctorProfile empty = new DoctorProfile();
                    empty.setUser(doctor);
                    return empty;
                });
    }

    // ── Create a new availability slot ────────────────────────────────
    public AvailabilitySlot createAvailability(
            String username,
            AvailabilityRequest request) {

        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Only doctors can create availability");
        }

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setDoctor(doctor);
        slot.setDate(request.getDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setAvailable(true);

        return availabilitySlotRepository.save(slot);
    }

    // ── Doctor's own full slot list (from DB) ─────────────────────────
    @Transactional
    public List<AvailabilitySlot> getMySlots(String username) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        LocalTime thresholdTime = LocalTime.now().plusHours(1);
        
        // Auto-delete expired available slots for cleanliness
        availabilitySlotRepository.deletePastAvailableSlots(
                LocalDate.now(), thresholdTime
        );
        
        return availabilitySlotRepository.findFutureSlotsByDoctor(doctor, LocalDate.now(), thresholdTime);
    }

    // ── Available slots for a doctor (patient view) ── purges past first
    @Transactional
    public List<AvailabilitySlot> getAvailableSlots(Integer doctorId) {
        LocalTime thresholdTime = LocalTime.now().plusHours(1);
        // Delete all expired available slots before returning
        availabilitySlotRepository.deletePastAvailableSlots(
                LocalDate.now(), thresholdTime
        );
        return availabilitySlotRepository.findFutureAvailableSlots(doctorId, LocalDate.now(), thresholdTime);
    }

    // ── Get all appointments for this doctor ──────────────────────────
    public List<Appointment> getAllAppointments(String username) {
        appointmentService.checkAndExpireUnpaidAppointments();
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return appointmentRepository.findByDoctorOrderByRequestedAtDesc(doctor);
    }

    // ── Get only pending appointments ─────────────────────────────────
    public List<Appointment> getPendingAppointments(String username) {
        appointmentService.checkAndExpireUnpaidAppointments();
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return appointmentRepository.findByDoctorAndStatus(doctor, AppointmentStatus.PENDING);
    }

    // ── Accept an appointment (starts 6-hour payment window) ──────────
    public Appointment acceptAppointment(String username, Integer appointmentId) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("You can only manage your own appointments");
        }
        if (appt.getStatus() != AppointmentStatus.PENDING) {
            throw new RuntimeException("Only pending appointments can be accepted");
        }

        appt.setStatus(AppointmentStatus.ACCEPTED);
        appt.setApprovedAt(java.time.LocalDateTime.now());
        // Set 6 hours payment deadline from now
        appt.setPaymentDeadline(java.time.LocalDateTime.now().plusHours(6));

        return appointmentRepository.save(appt);
    }

    // ── Reject a pending appointment (No refund needed as patient hasn't paid) ───
    public Appointment rejectAppointment(String username, Integer appointmentId) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("You can only manage your own appointments");
        }
        if (appt.getStatus() != AppointmentStatus.PENDING) {
            throw new RuntimeException("Only pending appointments can be rejected");
        }

        // If somehow marked paid, refund
        if ("PAID".equalsIgnoreCase(appt.getPaymentStatus())) {
            appt.setPaymentStatus("REFUNDED");
            appt.setRefundAmount(appt.getConsultationFee() != null ? appt.getConsultationFee() : 500.0);
            appt.setRefundTransactionId("RFD-" + System.currentTimeMillis());
            appt.setRefundedAt(java.time.LocalDateTime.now());
            appt.setRefundReason("Doctor rejected booking");
        }

        appt.setStatus(AppointmentStatus.REJECTED);
        appt.setCancellationReason("Rejected by doctor");

        // Re-open the slot so another patient can book it
        AvailabilitySlot slot = appt.getAvailabilitySlot();
        if (slot != null) {
            slot.setAvailable(true);
            availabilitySlotRepository.save(slot);
        }

        return appointmentRepository.save(appt);
    }

    // ── Doctor Cancels an Appointment (Mandatory refund if patient already paid) ───
    @Transactional
    public Appointment cancelAppointmentWithRefund(String username, Integer appointmentId, String reason) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("You can only manage your own appointments");
        }
        if (appt.getStatus() == AppointmentStatus.CANCELLED || appt.getStatus() == AppointmentStatus.REJECTED) {
            throw new RuntimeException("Appointment is already " + appt.getStatus());
        }
        if (appt.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel an already completed appointment");
        }

        boolean wasPaid = "PAID".equalsIgnoreCase(appt.getPaymentStatus());

        appt.setStatus(AppointmentStatus.CANCELLED);
        String cancelMsg = (reason != null && !reason.isBlank()) ? reason.trim() : "Doctor cancelled appointment";
        appt.setCancellationReason("Cancelled by Doctor: " + cancelMsg);

        if (wasPaid) {
            // Patient already paid -> Doctor MUST issue a refund
            appt.setPaymentStatus("REFUNDED");
            appt.setRefundAmount(appt.getConsultationFee() != null ? appt.getConsultationFee() : 500.0);
            appt.setRefundTransactionId("RFD-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
            appt.setRefundedAt(java.time.LocalDateTime.now());
            appt.setRefundReason("Doctor cancelled appointment: " + cancelMsg);
        }

        // Re-open the doctor's availability slot so another patient can book
        AvailabilitySlot slot = appt.getAvailabilitySlot();
        if (slot != null) {
            slot.setAvailable(true);
            availabilitySlotRepository.save(slot);
        }

        return appointmentRepository.save(appt);
    }

    // ── Delete an availability slot ────────────────────────────────────
    @Transactional
    public void deleteAvailabilitySlot(String username, Integer slotId) {
        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (!slot.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("You can only delete your own slots.");
        }

        // Dissociate any appointments from this slot before deletion
        List<Appointment> oldAppts = appointmentRepository.findByDoctor(doctor);
        for (Appointment a : oldAppts) {
            if (a.getAvailabilitySlot() != null && a.getAvailabilitySlot().getId().equals(slotId)) {
                a.setAvailabilitySlot(null);
                appointmentRepository.save(a);
            }
        }

        availabilitySlotRepository.delete(slot);
    }
}