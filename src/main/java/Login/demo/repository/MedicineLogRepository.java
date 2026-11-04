package Login.demo.repository;

import Login.demo.entity.MedicineLog;
import Login.demo.entity.PrescriptionMedicine;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicineLogRepository extends JpaRepository<MedicineLog, Integer> {
    List<MedicineLog> findByPatientOrderByLogDateDescTakenAtDesc(User patient);

    boolean existsByMedicineAndPatientAndLogDateAndScheduledTime(
            PrescriptionMedicine medicine, User patient, LocalDate logDate, String scheduledTime);

    Optional<MedicineLog> findByMedicineAndPatientAndLogDateAndScheduledTime(
            PrescriptionMedicine medicine, User patient, LocalDate logDate, String scheduledTime);

    List<MedicineLog> findByPatientAndLogDate(User patient, LocalDate logDate);

    void deleteByMedicine(PrescriptionMedicine medicine);
}
