package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_logs")
public class MedicineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    @JsonIgnoreProperties("prescription")
    private PrescriptionMedicine medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    /** Which scheduled time slot this log is for, e.g. "08:00" */
    @Column(name = "scheduled_time", nullable = false)
    private String scheduledTime;

    /** The actual date for which this dose is recorded */
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /** When the patient actually clicked "Taken" */
    @Column(name = "taken_at", nullable = false)
    private LocalDateTime takenAt;

    /** ON_TIME if within ±1 hr window */
    @Column(nullable = false)
    private String status;

    public MedicineLog() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public PrescriptionMedicine getMedicine() { return medicine; }
    public void setMedicine(PrescriptionMedicine medicine) { this.medicine = medicine; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }

    public LocalDateTime getTakenAt() { return takenAt; }
    public void setTakenAt(LocalDateTime takenAt) { this.takenAt = takenAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
