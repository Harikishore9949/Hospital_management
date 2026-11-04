package Login.demo.repository;

import Login.demo.entity.PharmacistProfile;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacistProfileRepository extends JpaRepository<PharmacistProfile, Integer> {
    Optional<PharmacistProfile> findByUser(User user);
    Optional<PharmacistProfile> findByUserId(Integer userId);
}

