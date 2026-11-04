package Login.demo.repository;

import Login.demo.entity.Role;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);

    List<User> findByRole(Role role);

    long countByRole(Role role);
}