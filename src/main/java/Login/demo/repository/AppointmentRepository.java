package Login.demo.repository;

import Login.demo.entity.Appointment;
import Login.demo.entity.AppointmentStatus;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository
        extends JpaRepository<Appointment, Integer> {

    List<Appointment> findByDoctorAndStatus(
            User doctor,
            AppointmentStatus status
    );

    List<Appointment> findByDoctorOrderByRequestedAtDesc(User doctor);

    /** Used by admin cascade-delete */
    List<Appointment> findByDoctor(User doctor);

    boolean existsByAvailabilitySlotId(
            Integer availabilitySlotId
    );

    boolean existsByAvailabilitySlotIdAndStatusIn(
            Integer availabilitySlotId,
            java.util.Collection<AppointmentStatus> statuses
    );

    long countByDoctorAndStatus(
            User doctor,
            AppointmentStatus status
    );

    List<Appointment> findByStatusAndPaymentStatus(
            AppointmentStatus status,
            String paymentStatus
    );

    List<Appointment> findByPatientOrderByRequestedAtDesc(User patient);

    boolean existsByPatientAndAvailabilitySlotIdAndStatus(
            User patient,
            Integer availabilitySlotId,
            AppointmentStatus status
    );

    long countByDoctorAndAvailabilitySlot_Date(
            User doctor,
            java.time.LocalDate date
    );

    List<Appointment> findByAvailabilitySlot_DateBefore(java.time.LocalDate cutoffDate);
}