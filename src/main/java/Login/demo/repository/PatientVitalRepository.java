package Login.demo.repository;

import Login.demo.entity.PatientVital;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientVitalRepository extends JpaRepository<PatientVital, Integer> {
    List<PatientVital> findByPatientOrderByRecordedAtDesc(User patient);
}
