package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_documents")
public class MedicalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The patient who owns this document */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnore
    private User patient;

    /** Optional link to a specific appointment (can be null for general docs) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    @JsonIgnore
    private Appointment appointment;

    /** Filename on disk (UUID-based to avoid collisions) */
    @Column(name = "file_name", nullable = false)
    private String fileName;

    /** Original name shown to users */
    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    /** Soft-delete: patient can delete their own docs */
    @Column(nullable = false)
    private boolean deleted = false;

    // ── Transient helpers for JSON responses ──────────────────────────────────
    @Transient
    private Long patientId;

    @Transient
    private String patientUsername;

    @Transient
    private Long appointmentId;

    public MedicalDocument() {}

    @PostLoad
    public void loadTransients() {
        if (patient != null) {
            patientId = (long) patient.getId();
            patientUsername = patient.getUsername();
        }
        if (appointment != null) {
            appointmentId = (long) appointment.getId();
        }
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }

    public Long getPatientId() { return patientId; }
    public String getPatientUsername() { return patientUsername; }
    public Long getAppointmentId() { return appointmentId; }
}
