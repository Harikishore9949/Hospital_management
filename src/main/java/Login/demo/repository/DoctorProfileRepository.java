package Login.demo.repository;

import Login.demo.entity.DoctorProfile;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Integer> {

    Optional<DoctorProfile> findByUser(User user);

    Optional<DoctorProfile> findByUserId(Integer userId);
}
