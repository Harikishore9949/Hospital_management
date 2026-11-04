package Login.demo.repository;

import Login.demo.entity.LabTestOrder;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LabTestOrderRepository extends JpaRepository<LabTestOrder, Integer> {
    List<LabTestOrder> findByPatientOrderByBookedAtDesc(User patient);
    List<LabTestOrder> findAllByOrderByBookedAtDesc();
    List<LabTestOrder> findByStatusOrderByBookedAtDesc(String status);
    List<LabTestOrder> findByPaymentStatusOrderByBookedAtDesc(String paymentStatus);
    long countByStatus(String status);
}
