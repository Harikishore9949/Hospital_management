package Login.demo.repository;

import Login.demo.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Integer> {

    Optional<Medicine> findByMedicineNameIgnoreCase(String medicineName);

    boolean existsByMedicineNameIgnoreCase(String medicineName);
}
