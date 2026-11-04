package Login.demo.repository;

import Login.demo.entity.EmergencyAlert;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Integer> {
    List<EmergencyAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<EmergencyAlert> findByPatientOrderByCreatedAtDesc(User patient);
    List<EmergencyAlert> findByAcceptedByOrderByCreatedAtDesc(User doctor);
    List<EmergencyAlert> findByStatusInOrderByCreatedAtDesc(List<String> statuses);
    long countByStatus(String status);
}
