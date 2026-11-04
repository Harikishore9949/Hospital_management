package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
public class EmergencyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    @Column(nullable = false, length = 2000)
    private String symptoms;

    /** CRITICAL / HIGH / MEDIUM */
    @Column(nullable = false)
    private String severity;

    @Column(length = 500)
    private String location;

    /** OPEN / ACCEPTED / RESOLVED / CANCELLED */
    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "accepted_by")
    @JsonIgnoreProperties({"password"})
    private User acceptedBy;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public EmergencyAlert() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(User acceptedBy) { this.acceptedBy = acceptedBy; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
