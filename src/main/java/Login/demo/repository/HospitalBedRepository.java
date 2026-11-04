package Login.demo.repository;

import Login.demo.entity.HospitalBed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalBedRepository extends JpaRepository<HospitalBed, Long> {
    List<HospitalBed> findAllByOrderByDisplayOrderAscIdAsc();
    List<HospitalBed> findByWardCodeOrderByDisplayOrderAscIdAsc(String wardCode);
    Optional<HospitalBed> findByBedNo(String bedNo);
    Optional<HospitalBed> findByWardCodeAndBedNo(String wardCode, String bedNo);
}

