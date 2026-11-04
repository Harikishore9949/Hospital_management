package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "prescription_medicines")
public class PrescriptionMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "prescription_id", nullable = false)
    @JsonIgnore
    private Prescription prescription;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(nullable = false)
    private String dosage;

    @Column(name = "times_per_day", nullable = false)
    private Integer timesPerDay;

    /**
     * Comma-separated HH:mm times, e.g. "08:00,14:00,20:00"
     * Determined by timesPerDay default schedule; doctor can override.
     */
    @Column(name = "scheduled_times", nullable = false)
    private String scheduledTimes;

    /** e.g. "After meals", "Before meals", "With water" */
    @Column
    private String instructions;

    /** Number of days the patient needs to take this medicine, e.g. 5, 7, 10 */
    @Column(name = "duration_days")
    private Integer durationDays = 5;

    public PrescriptionMedicine() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public Integer getTimesPerDay() { return timesPerDay; }
    public void setTimesPerDay(Integer timesPerDay) { this.timesPerDay = timesPerDay; }

    public String getScheduledTimes() { return scheduledTimes; }
    public void setScheduledTimes(String scheduledTimes) { this.scheduledTimes = scheduledTimes; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public Integer getDurationDays() { return durationDays != null ? durationDays : 5; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
}
