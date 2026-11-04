package Login.demo.repository;

import Login.demo.entity.VideoSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VideoSessionRepository extends JpaRepository<VideoSession, Long> {

    Optional<VideoSession> findByRoomId(String roomId);

    Optional<VideoSession> findByAppointment_Id(Integer appointmentId);

    Optional<VideoSession> findByAppointment_IdAndActiveTrue(Integer appointmentId);

    Optional<VideoSession> findByRoomIdAndActiveTrue(String roomId);
}
