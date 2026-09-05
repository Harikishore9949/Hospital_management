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

    List<Appointment> findByDoctorAndStatusOrderByQueuePositionAsc(
            User doctor,
            AppointmentStatus status
    );

    boolean existsByAvailabilitySlotId(
            Integer availabilitySlotId
    );

    long countByDoctorAndStatus(
            User doctor,
            AppointmentStatus status
    );
}