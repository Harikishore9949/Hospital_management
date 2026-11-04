package Login.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hospital_beds")
public class HospitalBed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ward_code", nullable = false)
    private String wardCode;

    @Column(name = "ward_name", nullable = false)
    private String wardName;

    @Column(name = "floor")
    private String floor;

    @Column(name = "bed_no", nullable = false)
    private String bedNo;

    @Column(name = "status", nullable = false)
    private String status; // "AVAILABLE", "OCCUPIED", "MAINTENANCE"

    @Column(name = "patient_code")
    private String patientCode; // "—", or patient name / PT-xxx

    @Column(name = "ventilator_equipped")
    private Boolean ventilatorEquipped = false;

    @Column(name = "nurse_ratio")
    private String nurseRatio;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public HospitalBed() {}

    public HospitalBed(String wardName, String wardCode, String floor, String nurseRatio,
                       String bedNo, String status, String patientCode,
                       Boolean ventilatorEquipped, Integer displayOrder) {
        this.wardName = wardName;
        this.wardCode = wardCode;
        this.floor = floor;
        this.nurseRatio = nurseRatio;
        this.bedNo = bedNo;
        this.status = status;
        this.patientCode = patientCode;
        this.ventilatorEquipped = ventilatorEquipped != null ? ventilatorEquipped : false;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWardCode() { return wardCode; }
    public void setWardCode(String wardCode) { this.wardCode = wardCode; }

    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }

    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }

    public String getBedNo() { return bedNo; }
    public void setBedNo(String bedNo) { this.bedNo = bedNo; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPatientCode() { return patientCode; }
    public void setPatientCode(String patientCode) { this.patientCode = patientCode; }

    public Boolean getVentilatorEquipped() { return ventilatorEquipped; }
    public void setVentilatorEquipped(Boolean ventilatorEquipped) { this.ventilatorEquipped = ventilatorEquipped; }

    public String getNurseRatio() { return nurseRatio; }
    public void setNurseRatio(String nurseRatio) { this.nurseRatio = nurseRatio; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

