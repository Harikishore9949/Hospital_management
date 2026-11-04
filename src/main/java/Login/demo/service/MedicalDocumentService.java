package Login.demo.service;

import Login.demo.entity.*;
import Login.demo.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MedicalDocumentService {

    @Value("${app.upload.dir:uploads/medical-docs}")
    private String uploadDir;

    private final MedicalDocumentRepository docRepo;
    private final UserRepository userRepo;
    private final AppointmentRepository appointmentRepo;
    private final VideoSessionRepository sessionRepo;

    public MedicalDocumentService(MedicalDocumentRepository docRepo,
                                  UserRepository userRepo,
                                  AppointmentRepository appointmentRepo,
                                  VideoSessionRepository sessionRepo) {
        this.docRepo = docRepo;
        this.userRepo = userRepo;
        this.appointmentRepo = appointmentRepo;
        this.sessionRepo = sessionRepo;
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    @Transactional
    public MedicalDocument uploadDocument(String patientUsername,
                                          Integer appointmentId,
                                          MultipartFile file) throws IOException {
        User patient = userRepo.findByUsername(patientUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Only patients can upload documents.");
        }

        // Validate file
        if (file.isEmpty()) throw new RuntimeException("File is empty.");
        if (file.getSize() > 20 * 1024 * 1024) throw new RuntimeException("File too large (max 20 MB).");

        // Resolve patient-specific upload dir
        Path patientDir = Paths.get(uploadDir, String.valueOf(patient.getId()));
        Files.createDirectories(patientDir);

        // Generate unique filename
        String ext = "";
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) ext = originalName.substring(dotIdx); // e.g. ".pdf"
        String storedName = UUID.randomUUID() + ext;

        // Save to disk
        Path target = patientDir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Persist metadata
        MedicalDocument doc = new MedicalDocument();
        doc.setPatient(patient);
        doc.setFileName(storedName);
        doc.setOriginalName(originalName);
        doc.setMimeType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setUploadedAt(LocalDateTime.now());
        doc.setDeleted(false);

        if (appointmentId != null) {
            appointmentRepo.findById(appointmentId).ifPresent(doc::setAppointment);
        }

        return docRepo.save(doc);
    }

    // ── Patient: list own documents ───────────────────────────────────────────

    public List<MedicalDocument> getPatientDocuments(String patientUsername) {
        return docRepo.findByPatient_UsernameAndDeletedFalseOrderByUploadedAtDesc(patientUsername);
    }

    // ── Doctor: list session documents (only during active session) ───────────

    public List<MedicalDocument> getSessionDocuments(String roomId, String doctorUsername) {
        // Find active session
        VideoSession session = sessionRepo.findByRoomIdAndActiveTrue(roomId)
                .orElseThrow(() -> new RuntimeException("No active session for room: " + roomId));

        // Verify doctor is part of this appointment
        Appointment appt = session.getAppointment();
        if (!appt.getDoctor().getUsername().equals(doctorUsername)) {
            throw new RuntimeException("Not authorized to view documents for this session.");
        }

        // Check if slot end time has passed
        AvailabilitySlot slot = appt.getAvailabilitySlot();
        if (slot != null && slot.getDate() != null && slot.getEndTime() != null) {
            LocalDateTime slotEnd = LocalDateTime.of(slot.getDate(), slot.getEndTime());
            if (LocalDateTime.now().isAfter(slotEnd)) {
                session.setActive(false);
                session.setEndedAt(LocalDateTime.now());
                sessionRepo.save(session);
                throw new RuntimeException("Session time has ended. Patient documents are no longer accessible to doctor.");
            }
        }

        // Return all non-deleted documents for this patient
        return docRepo.findByPatient_UsernameAndDeletedFalseOrderByUploadedAtDesc(appt.getPatient().getUsername());
    }

    // ── Patient: soft-delete a document ──────────────────────────────────────

    @Transactional
    public void deleteDocument(Long docId, String patientUsername) {
        MedicalDocument doc = docRepo.findByIdAndDeletedFalse(docId)
                .orElseThrow(() -> new RuntimeException("Document not found."));

        if (!doc.getPatient().getUsername().equals(patientUsername)) {
            throw new RuntimeException("Not authorized to delete this document.");
        }

        doc.setDeleted(true);
        docRepo.save(doc);
    }

    // ── Serve file bytes (with access control) ────────────────────────────────

    public Resource serveFile(Long docId, String username) throws MalformedURLException {
        MedicalDocument doc = docRepo.findByIdAndDeletedFalse(docId)
                .orElseThrow(() -> new RuntimeException("Document not found."));

        User requester = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isPatient = doc.getPatient().getUsername().equals(username);
        boolean isAuthorizedDoctor = false;

        if (requester.getRole() == Role.DOCTOR) {
            String patientUsername = doc.getPatient().getUsername();
            // Check if there is an active, non-expired video session between this doctor and this patient
            isAuthorizedDoctor = sessionRepo.findAll().stream().anyMatch(s -> {
                if (!s.isActive()) return false;
                Appointment appt = s.getAppointment();
                if (!appt.getDoctor().getUsername().equals(username) || !appt.getPatient().getUsername().equals(patientUsername)) return false;
                AvailabilitySlot slot = appt.getAvailabilitySlot();
                if (slot != null && slot.getDate() != null && slot.getEndTime() != null) {
                    LocalDateTime slotEnd = LocalDateTime.of(slot.getDate(), slot.getEndTime());
                    if (LocalDateTime.now().isAfter(slotEnd)) return false;
                }
                return true;
            });
        }

        if (!isPatient && !isAuthorizedDoctor) {
            throw new RuntimeException("Access denied: session has ended. Documents are restricted to patient only.");
        }

        Path patientDir = Paths.get(uploadDir, String.valueOf(doc.getPatient().getId()));
        Path filePath = patientDir.resolve(doc.getFileName());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) throw new RuntimeException("File not found on server.");
        return resource;
    }

    public MedicalDocument getDocumentMeta(Long docId) {
        return docRepo.findByIdAndDeletedFalse(docId)
                .orElseThrow(() -> new RuntimeException("Document not found."));
    }
}
