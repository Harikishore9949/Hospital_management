package Login.demo.repository;

import Login.demo.entity.AvailabilitySlot;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AvailabilitySlotRepository
        extends JpaRepository<AvailabilitySlot, Integer> {

    List<AvailabilitySlot> findByDoctorAndDateAndAvailableTrue(
            User doctor,
            LocalDate date
    );

    // All future available slots for a specific doctor (for patients)
    @Query("SELECT s FROM AvailabilitySlot s WHERE s.doctor.id = :doctorId AND s.available = true AND " +
           "(s.date > :today OR (s.date = :today AND s.startTime >= :thresholdTime)) " +
           "ORDER BY s.date ASC, s.startTime ASC")
    List<AvailabilitySlot> findFutureAvailableSlots(Integer doctorId, LocalDate today, LocalTime thresholdTime);

    // All future slots for a specific doctor (for doctor's own view — includes booked)
    @Query("SELECT s FROM AvailabilitySlot s WHERE s.doctor = :doctor AND " +
           "(s.date > :today OR (s.date = :today AND s.startTime >= :thresholdTime)) " +
           "ORDER BY s.date ASC, s.startTime ASC")
    List<AvailabilitySlot> findFutureSlotsByDoctor(User doctor, LocalDate today, LocalTime thresholdTime);

    // Delete past available slots that have NO linked appointments
    // (slots with appointments cannot be deleted due to FK constraint)
    @Modifying
    @Transactional
    @Query("DELETE FROM AvailabilitySlot s WHERE s.available = true AND " +
           "(s.date < :today OR (s.date = :today AND s.startTime < :thresholdTime)) AND " +
           "s.id NOT IN (SELECT a.availabilitySlot.id FROM Appointment a)")
    void deletePastAvailableSlots(LocalDate today, LocalTime thresholdTime);

    /** Used by admin cascade-delete */
    List<AvailabilitySlot> findByDoctor(User doctor);
}