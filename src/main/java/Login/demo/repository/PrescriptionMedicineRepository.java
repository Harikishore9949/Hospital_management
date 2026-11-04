package Login.demo.repository;

import Login.demo.entity.PrescriptionMedicine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionMedicineRepository extends JpaRepository<PrescriptionMedicine, Integer> {
}
