package Login.demo.repository;

import Login.demo.entity.AvailabilitySlot;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AvailabilitySlotRepository
        extends JpaRepository<AvailabilitySlot, Integer> {

    List<AvailabilitySlot> findByDoctorAndDateAndAvailableTrue(
            User doctor,
            LocalDate date
    );

    List<AvailabilitySlot> findByDoctorIdAndAvailableTrueOrderByDateAscStartTimeAsc(
            Integer doctorId
    );
}