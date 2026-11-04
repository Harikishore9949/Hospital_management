package Login.demo.repository;

import Login.demo.entity.Appointment;
import Login.demo.entity.Prescription;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    List<Prescription> findByPatientOrderByIssuedAtDesc(User patient);
    List<Prescription> findByDoctorOrderByIssuedAtDesc(User doctor);
    Optional<Prescription> findByAppointment(Appointment appointment);
}
