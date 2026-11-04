package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "medicine_order_items")
public class MedicineOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private MedicineOrder medicineOrder;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "sheets_ordered", nullable = false)
    private Integer sheetsOrdered;

    @Column(name = "price_per_sheet", nullable = false)
    private Double pricePerSheet;

    @Column(name = "item_total", nullable = false)
    private Double itemTotal;

    public MedicineOrderItem() {}

    public MedicineOrderItem(MedicineOrder medicineOrder, String medicineName, Integer sheetsOrdered, Double pricePerSheet, Double itemTotal) {
        this.medicineOrder = medicineOrder;
        this.medicineName = medicineName;
        this.sheetsOrdered = sheetsOrdered;
        this.pricePerSheet = pricePerSheet;
        this.itemTotal = itemTotal;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public MedicineOrder getMedicineOrder() { return medicineOrder; }
    public void setMedicineOrder(MedicineOrder medicineOrder) { this.medicineOrder = medicineOrder; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public Integer getSheetsOrdered() { return sheetsOrdered; }
    public void setSheetsOrdered(Integer sheetsOrdered) { this.sheetsOrdered = sheetsOrdered; }

    public Double getPricePerSheet() { return pricePerSheet; }
    public void setPricePerSheet(Double pricePerSheet) { this.pricePerSheet = pricePerSheet; }

    public Double getItemTotal() { return itemTotal; }
    public void setItemTotal(Double itemTotal) { this.itemTotal = itemTotal; }
}
