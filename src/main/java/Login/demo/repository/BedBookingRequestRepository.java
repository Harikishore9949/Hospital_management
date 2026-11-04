package Login.demo.repository;

import Login.demo.entity.BedBookingRequest;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedBookingRequestRepository extends JpaRepository<BedBookingRequest, Integer> {
    List<BedBookingRequest> findByPatientOrderByRequestedAtDesc(User patient);
    List<BedBookingRequest> findAllByOrderByRequestedAtDesc();
    List<BedBookingRequest> findByStatusOrderByRequestedAtDesc(String status);
}

