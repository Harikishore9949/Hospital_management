package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "medication_reminders")
public class MedicationReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    @Column(nullable = false)
    private String medicineName;

    private String dosage;

    /** DAILY, ALTERNATE_DAYS, CUSTOM */
    @Column(nullable = false)
    private String scheduleType;

    /** Comma-separated times e.g. "08:00,20:00" */
    @Column(nullable = false)
    private String scheduledTimes;

    private String instructions;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public MedicationReminder() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getScheduleType() { return scheduleType; }
    public void setScheduleType(String scheduleType) { this.scheduleType = scheduleType; }

    public String getScheduledTimes() { return scheduledTimes; }
    public void setScheduledTimes(String scheduledTimes) { this.scheduledTimes = scheduledTimes; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
