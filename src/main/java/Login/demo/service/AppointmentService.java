package Login.demo.service;

import Login.demo.dto.AppointmentRequest;
import Login.demo.entity.*;
import Login.demo.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final VideoSessionRepository videoSessionRepository;
    private final MedicalDocumentRepository medicalDocumentRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AvailabilitySlotRepository availabilitySlotRepository,
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            SimpMessagingTemplate messagingTemplate,
            VideoSessionRepository videoSessionRepository,
            MedicalDocumentRepository medicalDocumentRepository) {

        this.appointmentRepository = appointmentRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.messagingTemplate = messagingTemplate;
        this.videoSessionRepository = videoSessionRepository;
        this.medicalDocumentRepository = medicalDocumentRepository;
    }

    public Appointment bookAppointment(
            String username,
            AppointmentRequest request) {

        // Find the logged-in patient
        User patient = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Only patients can book appointments");
        }

        // Find the requested availability slot
        AvailabilitySlot slot = availabilitySlotRepository
                .findById(request.getAvailabilitySlotId())
                .orElseThrow(() -> new RuntimeException("Availability slot not found"));

        // Rule: Before the actual meeting schedule start time, no one can book appointment
        LocalDateTime slotStart = LocalDateTime.of(slot.getDate(), slot.getStartTime());
        if (!slotStart.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book appointment for a slot that has already started or passed.");
        }

        // Rule: Patient cannot book the same slot again if doctor previously rejected them for it
        if (appointmentRepository.existsByPatientAndAvailabilitySlotIdAndStatus(patient, slot.getId(), AppointmentStatus.REJECTED)) {
            throw new RuntimeException("You cannot book this slot again as your previous booking was rejected by the doctor. Please select another slot.");
        }

        // Check whether the slot is still available
        if (!slot.isAvailable()) {
            throw new RuntimeException("This slot is no longer available");
        }

        // Check whether this slot currently has an active (PENDING or ACCEPTED) booking
        if (appointmentRepository.existsByAvailabilitySlotIdAndStatusIn(
                slot.getId(),
                List.of(AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED))) {
            throw new RuntimeException("This slot has already been booked");
        }

        // Calculate queue position: Starts from 1 every new day for this doctor
        long dailyCount = appointmentRepository.countByDoctorAndAvailabilitySlot_Date(slot.getDoctor(), slot.getDate());
        int queueToken = (int) dailyCount + 1;

        // Create appointment with patient details
        Appointment appointment = new Appointment();
        appointment.setDoctor(slot.getDoctor());
        appointment.setPatient(patient);
        appointment.setAvailabilitySlot(slot);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setPaymentStatus("UNPAID");
        appointment.setQueuePosition(queueToken);
        appointment.setRequestedAt(LocalDateTime.now());
        appointment.setApprovedAt(null);
        appointment.setPaymentDeadline(null);

        // Store patient details filled in the booking form
        appointment.setPatientFullName(request.getPatientFullName());
        appointment.setPatientAge(request.getPatientAge());
        appointment.setPatientPhone(request.getPatientPhone());
        appointment.setPatientSex(request.getPatientSex());
        appointment.setHealthIssue(request.getHealthIssue());

        // Mark slot as unavailable (reserved for this booking)
        slot.setAvailable(false);
        availabilitySlotRepository.save(slot);

        Appointment saved = appointmentRepository.save(appointment);

        // Increment doctor's actual consults count upon consultation booking
        if (slot.getDoctor() != null) {
            doctorProfileRepository.findByUser(slot.getDoctor()).ifPresent(dp -> {
                dp.setConsultsCount(dp.getConsultsCount() + 1);
                doctorProfileRepository.save(dp);
            });
        }

        return saved;
    }

    /**
     * Periodically checks and auto-rejects accepted appointments that were not paid within 6 hours.
     * Re-opens the availability slot so another patient can book it.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000)
    @org.springframework.transaction.annotation.Transactional
    public void autoRejectExpiredUnpaidAppointments() {
        checkAndExpireUnpaidAppointments();
    }

    @org.springframework.transaction.annotation.Transactional
    public void checkAndExpireUnpaidAppointments() {
        LocalDateTime now = LocalDateTime.now();
        List<Appointment> acceptedUnpaid = appointmentRepository.findByStatusAndPaymentStatus(
                AppointmentStatus.ACCEPTED, "UNPAID"
        );
        for (Appointment appt : acceptedUnpaid) {
            if (appt.getPaymentDeadline() != null && now.isAfter(appt.getPaymentDeadline())) {
                appt.setStatus(AppointmentStatus.REJECTED);
                appt.setCancellationReason("Auto-rejected: Consultation fee was not paid within the 6-hour window after doctor approval.");
                if (appt.getAvailabilitySlot() != null) {
                    AvailabilitySlot slot = appt.getAvailabilitySlot();
                    slot.setAvailable(true);
                    availabilitySlotRepository.save(slot);
                }
                appointmentRepository.save(appt);
            }
        }
    }

    public List<Appointment> getMyAppointments(String username) {
        checkAndExpireUnpaidAppointments();
        User patient = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return appointmentRepository.findByPatientOrderByRequestedAtDesc(patient);
    }

    @org.springframework.transaction.annotation.Transactional
    public Appointment cancelAppointment(String username, Integer appointmentId, String reason) {
        User patient = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Access denied: You can only cancel your own appointments");
        }

        if (appt.getStatus() == AppointmentStatus.CANCELLED || appt.getStatus() == AppointmentStatus.REJECTED) {
            throw new RuntimeException("Appointment is already " + appt.getStatus());
        }

        boolean wasPaid = "PAID".equalsIgnoreCase(appt.getPaymentStatus());

        appt.setStatus(AppointmentStatus.CANCELLED);
        appt.setCancellationReason(reason != null && !reason.isBlank() ? reason.trim() : "Cancelled by patient");

        if (wasPaid) {
            appt.setPaymentStatus("REFUNDED");
            appt.setRefundAmount(appt.getConsultationFee() != null ? appt.getConsultationFee() : 500.0);
            appt.setRefundTransactionId("RFD-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
            appt.setRefundedAt(LocalDateTime.now());
            appt.setRefundReason("Cancelled by patient - full refund initiated");
        }

        // Release the doctor's availability slot so another patient can book it
        if (appt.getAvailabilitySlot() != null) {
            AvailabilitySlot slot = appt.getAvailabilitySlot();
            slot.setAvailable(true);
            availabilitySlotRepository.save(slot);
        }

        return appointmentRepository.save(appt);
    }

    @org.springframework.transaction.annotation.Transactional
    public Appointment rescheduleAppointment(String username, Integer appointmentId, Integer newSlotId) {
        User patient = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Access denied");
        }

        AvailabilitySlot newSlot = availabilitySlotRepository.findById(newSlotId)
                .orElseThrow(() -> new RuntimeException("Selected new slot not found"));

        if (!newSlot.isAvailable()) {
            throw new RuntimeException("The selected slot is no longer available");
        }

        // Release old slot
        if (appt.getAvailabilitySlot() != null) {
            AvailabilitySlot oldSlot = appt.getAvailabilitySlot();
            oldSlot.setAvailable(true);
            availabilitySlotRepository.save(oldSlot);
        }

        // Book new slot
        newSlot.setAvailable(false);
        availabilitySlotRepository.save(newSlot);

        appt.setAvailabilitySlot(newSlot);
        appt.setStatus(AppointmentStatus.PENDING);
        appt.setCancellationReason(null);

        return appointmentRepository.save(appt);
    }

    @org.springframework.transaction.annotation.Transactional
    public Appointment payAppointment(String username, Integer appointmentId, String txId) {
        User patient = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (appt.getStatus() == AppointmentStatus.CANCELLED || appt.getStatus() == AppointmentStatus.REJECTED) {
            throw new RuntimeException("Cannot pay for an appointment that is " + appt.getStatus());
        }

        // Check if 6-hour payment deadline has passed for accepted appointment
        if (appt.getStatus() == AppointmentStatus.ACCEPTED && appt.getPaymentDeadline() != null) {
            if (LocalDateTime.now().isAfter(appt.getPaymentDeadline())) {
                appt.setStatus(AppointmentStatus.REJECTED);
                appt.setCancellationReason("Auto-rejected: 6-hour payment deadline expired.");
                if (appt.getAvailabilitySlot() != null) {
                    AvailabilitySlot slot = appt.getAvailabilitySlot();
                    slot.setAvailable(true);
                    availabilitySlotRepository.save(slot);
                }
                appointmentRepository.save(appt);
                throw new RuntimeException("Payment window expired. The 6-hour deadline after doctor approval has passed and this appointment was cancelled.");
            }
        }

        appt.setPaymentStatus("PAID");
        appt.setPaidAt(LocalDateTime.now());
        appt.setTransactionId(txId != null && !txId.isBlank() ? txId : "TXN-" + System.currentTimeMillis());

        Appointment saved = appointmentRepository.save(appt);

        // Instantly notify doctor dashboard via WebSocket
        if (messagingTemplate != null && saved.getDoctor() != null) {
            try {
                Map<String, Object> payload = Map.of(
                        "type", "PAYMENT_RECEIVED",
                        "appointmentId", saved.getId(),
                        "patientName", saved.getPatientFullName() != null ? saved.getPatientFullName() : (saved.getPatient() != null ? saved.getPatient().getUsername() : "Patient"),
                        "amount", saved.getConsultationFee() != null ? saved.getConsultationFee() : 500.0,
                        "queuePosition", saved.getQueuePosition() != null ? saved.getQueuePosition() : 1,
                        "timestamp", LocalDateTime.now().toString()
                );
                messagingTemplate.convertAndSend("/topic/doctor-notifications/" + saved.getDoctor().getUsername(), payload);
                messagingTemplate.convertAndSend("/topic/appointments", payload);
            } catch (Exception ignored) {}
        }

        return saved;
    }

    /**
     * Delete appointments whose schedule has completed and is more than 1 day old.
     * Runs daily at 2:00 AM, and also runs during cleanup cycles.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * ?")
    @org.springframework.transaction.annotation.Transactional
    public void cleanupOldAppointments() {
        try {
            java.time.LocalDate cutoffDate = java.time.LocalDate.now().minusDays(1);
            List<Appointment> oldAppointments = appointmentRepository.findByAvailabilitySlot_DateBefore(cutoffDate);
            for (Appointment appt : oldAppointments) {
                try {
                    videoSessionRepository.findByAppointment_Id(appt.getId())
                            .ifPresent(videoSessionRepository::delete);
                    medicalDocumentRepository.findByAppointment(appt).forEach(doc -> {
                        doc.setAppointment(null);
                        medicalDocumentRepository.save(doc);
                    });
                    appointmentRepository.delete(appt);
                } catch (Exception e) {
                    // ignore individual failure and proceed
                }
            }
        } catch (Exception ignored) {}
    }
}