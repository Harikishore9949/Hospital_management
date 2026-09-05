package Login.demo.service;

import Login.demo.dto.AppointmentRequest;
import Login.demo.entity.Appointment;
import Login.demo.entity.AppointmentStatus;
import Login.demo.entity.AvailabilitySlot;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.repository.AppointmentRepository;
import Login.demo.repository.AvailabilitySlotRepository;
import Login.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserRepository userRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AvailabilitySlotRepository availabilitySlotRepository,
            UserRepository userRepository) {

        this.appointmentRepository = appointmentRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.userRepository = userRepository;
    }

    public Appointment bookAppointment(
            String username,
            AppointmentRequest request) {

        // Find the logged-in patient
        User patient = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Patient not found"));

        // Make sure the logged-in user is a patient
        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException(
                    "Only patients can book appointments");
        }

        // Find the requested availability slot
        AvailabilitySlot slot =
                availabilitySlotRepository
                        .findById(request.getAvailabilitySlotId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Availability slot not found"));

        // Check whether the slot is still available
        if (!slot.isAvailable()) {
            throw new RuntimeException(
                    "This slot is no longer available");
        }

        // Check whether this slot has already been booked
        if (appointmentRepository
                .existsByAvailabilitySlotId(slot.getId())) {

            throw new RuntimeException(
                    "This slot has already been booked");
        }

        // Create appointment
        Appointment appointment = new Appointment();

        appointment.setDoctor(slot.getDoctor());
        appointment.setPatient(patient);
        appointment.setAvailabilitySlot(slot);

        appointment.setStatus(
                AppointmentStatus.PENDING
        );

        appointment.setQueuePosition(null);

        appointment.setRequestedAt(
                LocalDateTime.now()
        );

        // Mark slot as unavailable
        slot.setAvailable(false);

        availabilitySlotRepository.save(slot);

        // Save appointment
        return appointmentRepository.save(appointment);
    }
}