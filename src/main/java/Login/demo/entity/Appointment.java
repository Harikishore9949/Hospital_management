package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne
    @JoinColumn(name = "availability_slot_id", nullable = true)
    private AvailabilitySlot availabilitySlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    private Integer queuePosition;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    // ── Patient details filled during booking ──────────────────────────
    @Column(name = "patient_full_name")
    private String patientFullName;

    @Column(name = "patient_age")
    private Integer patientAge;

    @Column(name = "patient_phone")
    private String patientPhone;

    @Column(name = "patient_sex")
    private String patientSex;

    @Column(name = "health_issue", length = 1000)
    private String healthIssue;

    public Appointment() {
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getDoctor() { return doctor; }
    public void setDoctor(User doctor) { this.doctor = doctor; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public AvailabilitySlot getAvailabilitySlot() { return availabilitySlot; }
    public void setAvailabilitySlot(AvailabilitySlot availabilitySlot) { this.availabilitySlot = availabilitySlot; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public Integer getQueuePosition() { return queuePosition; }
    public void setQueuePosition(Integer queuePosition) { this.queuePosition = queuePosition; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    @Column(name = "payment_status")
    private String paymentStatus = "UNPAID";

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "consultation_fee")
    private Double consultationFee = 500.0;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "payment_deadline")
    private LocalDateTime paymentDeadline;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "refund_amount")
    private Double refundAmount;

    @Column(name = "refund_transaction_id")
    private String refundTransactionId;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getPaymentDeadline() { return paymentDeadline; }
    public void setPaymentDeadline(LocalDateTime paymentDeadline) { this.paymentDeadline = paymentDeadline; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public Double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(Double refundAmount) { this.refundAmount = refundAmount; }

    public String getRefundTransactionId() { return refundTransactionId; }
    public void setRefundTransactionId(String refundTransactionId) { this.refundTransactionId = refundTransactionId; }

    public LocalDateTime getRefundedAt() { return refundedAt; }
    public void setRefundedAt(LocalDateTime refundedAt) { this.refundedAt = refundedAt; }

    public String getRefundReason() { return refundReason; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }

    public String getPatientFullName() { return patientFullName; }
    public void setPatientFullName(String patientFullName) { this.patientFullName = patientFullName; }

    public Integer getPatientAge() { return patientAge; }
    public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getPatientSex() { return patientSex; }
    public void setPatientSex(String patientSex) { this.patientSex = patientSex; }

    public String getHealthIssue() { return healthIssue; }
    public void setHealthIssue(String healthIssue) { this.healthIssue = healthIssue; }
}