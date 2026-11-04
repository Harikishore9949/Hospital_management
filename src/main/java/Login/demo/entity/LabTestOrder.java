package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_test_orders")
public class LabTestOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    @Column(nullable = false)
    private String testName;

    private String testCategory; // Blood, Cardiac, Thyroid, Diabetes, Organ Panel
    private Double price;
    private String collectionType; // HOME_COLLECTION, HOSPITAL_WALKIN
    private LocalDate scheduledDate;
    private String scheduledTime;
    private String status; // BOOKED, SAMPLE_COLLECTED, ANALYZING, COMPLETED
    private String paymentStatus; // PAID, PENDING
    private String transactionId;

    @Column(length = 3000)
    private String resultsJson;

    private String labCenterName;
    private String pathologistName;

    @Column(length = 1500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime bookedAt;

    private LocalDateTime completedAt;

    private String sampleAccessionNumber;
    private LocalDateTime sampleCollectedAt;
    private String estimatedResultTime;
    private String equipmentUsed;
    private String scheduledSlotNotes;

    private String hardcopyFileName;
    private String hardcopyOriginalName;
    private LocalDateTime hardcopyUploadedAt;

    public LabTestOrder() {
        this.bookedAt = LocalDateTime.now();
        this.status = "SAMPLE_PENDING";
        this.paymentStatus = "PAID";
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }

    public String getTestCategory() { return testCategory; }
    public void setTestCategory(String testCategory) { this.testCategory = testCategory; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getCollectionType() { return collectionType; }
    public void setCollectionType(String collectionType) { this.collectionType = collectionType; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getResultsJson() { return resultsJson; }
    public void setResultsJson(String resultsJson) { this.resultsJson = resultsJson; }

    public LocalDateTime getBookedAt() { return bookedAt; }
    public void setBookedAt(LocalDateTime bookedAt) { this.bookedAt = bookedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getLabCenterName() { return labCenterName; }
    public void setLabCenterName(String labCenterName) { this.labCenterName = labCenterName; }

    public String getPathologistName() { return pathologistName; }
    public void setPathologistName(String pathologistName) { this.pathologistName = pathologistName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getSampleAccessionNumber() { return sampleAccessionNumber; }
    public void setSampleAccessionNumber(String sampleAccessionNumber) { this.sampleAccessionNumber = sampleAccessionNumber; }

    public LocalDateTime getSampleCollectedAt() { return sampleCollectedAt; }
    public void setSampleCollectedAt(LocalDateTime sampleCollectedAt) { this.sampleCollectedAt = sampleCollectedAt; }

    public String getEstimatedResultTime() { return estimatedResultTime; }
    public void setEstimatedResultTime(String estimatedResultTime) { this.estimatedResultTime = estimatedResultTime; }

    public String getEquipmentUsed() { return equipmentUsed; }
    public void setEquipmentUsed(String equipmentUsed) { this.equipmentUsed = equipmentUsed; }

    public String getScheduledSlotNotes() { return scheduledSlotNotes; }
    public void setScheduledSlotNotes(String scheduledSlotNotes) { this.scheduledSlotNotes = scheduledSlotNotes; }

    public String getHardcopyFileName() { return hardcopyFileName; }
    public void setHardcopyFileName(String hardcopyFileName) { this.hardcopyFileName = hardcopyFileName; }

    public String getHardcopyOriginalName() { return hardcopyOriginalName; }
    public void setHardcopyOriginalName(String hardcopyOriginalName) { this.hardcopyOriginalName = hardcopyOriginalName; }

    public LocalDateTime getHardcopyUploadedAt() { return hardcopyUploadedAt; }
    public void setHardcopyUploadedAt(LocalDateTime hardcopyUploadedAt) { this.hardcopyUploadedAt = hardcopyUploadedAt; }
}
