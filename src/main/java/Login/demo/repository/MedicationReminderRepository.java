package Login.demo.repository;

import Login.demo.entity.MedicationReminder;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, Integer> {
    List<MedicationReminder> findByPatientOrderByCreatedAtDesc(User patient);
    List<MedicationReminder> findByPatient_UsernameOrderByCreatedAtDesc(String username);
}
