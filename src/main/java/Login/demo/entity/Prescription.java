package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id", nullable = false)
    @JsonIgnoreProperties({"doctor", "patient", "availabilitySlot", "healthIssue"})
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<PrescriptionMedicine> medicines = new ArrayList<>();

    public Prescription() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public User getDoctor() { return doctor; }
    public void setDoctor(User doctor) { this.doctor = doctor; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public List<PrescriptionMedicine> getMedicines() { return medicines; }
    public void setMedicines(List<PrescriptionMedicine> medicines) { this.medicines = medicines; }
}
