package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bed_booking_requests")
public class BedBookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "ward_name", nullable = false)
    private String wardName;

    @Column(name = "ward_code")
    private String wardCode;

    @Column(name = "bed_no")
    private String bedNo;

    @Column(name = "urgency")
    private String urgency; // NORMAL, HIGH, CRITICAL

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status")
    private String status; // PENDING, ACCEPTED, REJECTED, DISCHARGED

    @Column(name = "admin_notes")
    private String adminNotes;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public BedBookingRequest() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }

    public String getWardCode() { return wardCode; }
    public void setWardCode(String wardCode) { this.wardCode = wardCode; }

    public String getBedNo() { return bedNo; }
    public void setBedNo(String bedNo) { this.bedNo = bedNo; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}

