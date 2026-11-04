package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicine_orders")
public class MedicineOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "total_price", nullable = false)
    private Double totalPrice;

    @Column(name = "ordered_at", nullable = false)
    private LocalDateTime orderedAt;

    @Column(nullable = false)
    private String status; // "ORDERED", "DISPENSED", "CANCELLED"

    @OneToMany(mappedBy = "medicineOrder", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<MedicineOrderItem> items = new ArrayList<>();

    public MedicineOrder() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public LocalDateTime getOrderedAt() { return orderedAt; }
    public void setOrderedAt(LocalDateTime orderedAt) { this.orderedAt = orderedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<MedicineOrderItem> getItems() { return items; }
    public void setItems(List<MedicineOrderItem> items) { this.items = items; }
}
