package Login.demo.service;

import Login.demo.dto.AppointmentRequest;
import Login.demo.entity.*;
import Login.demo.repository.AppointmentRepository;
import Login.demo.repository.AvailabilitySlotRepository;
import Login.demo.repository.DoctorProfileRepository;
import Login.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AvailabilitySlotRepository availabilitySlotRepository,
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository) {

        this.appointmentRepository = appointmentRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
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

        // Create appointment with patient details
        Appointment appointment = new Appointment();
        appointment.setDoctor(slot.getDoctor());
        appointment.setPatient(patient);
        appointment.setAvailabilitySlot(slot);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setPaymentStatus("UNPAID");
        appointment.setQueuePosition(null);
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

        return appointmentRepository.save(appt);
    }
}