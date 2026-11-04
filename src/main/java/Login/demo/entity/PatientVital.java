package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_vitals")
public class PatientVital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    private Integer systolic; // mmHg e.g. 120
    private Integer diastolic; // mmHg e.g. 80
    private Double bloodSugar; // mg/dL e.g. 95.0
    private String sugarContext; // FASTING, POST_PRANDIAL, RANDOM
    private Integer heartRate; // bpm e.g. 72
    private Integer spo2; // % e.g. 98
    private Double temperature; // °F e.g. 98.6
    private Double weight; // kg e.g. 70.0
    private Double height; // cm e.g. 175.0
    private Double bmi; // e.g. 22.8
    private String statusCategory; // NORMAL, ELEVATED, ATTENTION_REQUIRED

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    public PatientVital() {
        this.recordedAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public Integer getSystolic() { return systolic; }
    public void setSystolic(Integer systolic) { this.systolic = systolic; }

    public Integer getDiastolic() { return diastolic; }
    public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }

    public Double getBloodSugar() { return bloodSugar; }
    public void setBloodSugar(Double bloodSugar) { this.bloodSugar = bloodSugar; }

    public String getSugarContext() { return sugarContext; }
    public void setSugarContext(String sugarContext) { this.sugarContext = sugarContext; }

    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer spo2) { this.spo2 = spo2; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }

    public Double getBmi() { return bmi; }
    public void setBmi(Double bmi) { this.bmi = bmi; }

    public String getStatusCategory() { return statusCategory; }
    public void setStatusCategory(String statusCategory) { this.statusCategory = statusCategory; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
