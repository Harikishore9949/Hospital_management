package Login.demo.repository;

import Login.demo.entity.Appointment;
import Login.demo.entity.MedicalDocument;
import Login.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {

    /** All non-deleted docs belonging to a patient */
    List<MedicalDocument> findByPatientAndDeletedFalseOrderByUploadedAtDesc(User patient);

    /** Docs linked to a specific appointment (for doctor's session view) */
    List<MedicalDocument> findByAppointment_IdAndDeletedFalseOrderByUploadedAtDesc(Integer appointmentId);

    /** All docs for a patient (including appointment-linked ones) */
    List<MedicalDocument> findByPatient_UsernameAndDeletedFalseOrderByUploadedAtDesc(String username);

    Optional<MedicalDocument> findByIdAndDeletedFalse(Long id);

    /** Used by admin cascade-delete: all docs for a given appointment */
    List<MedicalDocument> findByAppointment(Appointment appointment);
}
