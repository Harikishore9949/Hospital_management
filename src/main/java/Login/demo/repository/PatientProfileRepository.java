package Login.demo.repository;

import Login.demo.entity.PatientProfile;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, Integer> {
    Optional<PatientProfile> findByUser(User user);
    Optional<PatientProfile> findByUser_Username(String username);
}

