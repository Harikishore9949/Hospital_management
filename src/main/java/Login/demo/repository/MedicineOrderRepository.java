package Login.demo.repository;

import Login.demo.entity.MedicineOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineOrderRepository extends JpaRepository<MedicineOrder, Integer> {

    List<MedicineOrder> findByPatientIdOrderByOrderedAtDesc(Integer patientId);

    List<MedicineOrder> findAllByOrderByOrderedAtDesc();

    List<MedicineOrder> findByPrescription(Login.demo.entity.Prescription prescription);
}
