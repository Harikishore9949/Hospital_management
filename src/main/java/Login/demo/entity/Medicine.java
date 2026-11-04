package Login.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "medicine_name", nullable = false, unique = true)
    private String medicineName;

    @Column(name = "sheets_count", nullable = false)
    private Integer sheetsCount;

    @Column(name = "tablets_per_sheet", nullable = false)
    private Integer tabletsPerSheet;

    @Column(name = "loose_tablets")
    private Integer looseTablets = 0;

    @Column(name = "price_per_sheet", nullable = false)
    private Double pricePerSheet;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Medicine() {}

    public Medicine(String medicineName, Integer sheetsCount, Integer tabletsPerSheet, Double pricePerSheet) {
        this.medicineName = medicineName;
        this.sheetsCount = sheetsCount;
        this.tabletsPerSheet = tabletsPerSheet;
        this.pricePerSheet = pricePerSheet;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public Integer getSheetsCount() { return sheetsCount; }
    public void setSheetsCount(Integer sheetsCount) { this.sheetsCount = sheetsCount; }

    public Integer getTabletsPerSheet() { return tabletsPerSheet; }
    public void setTabletsPerSheet(Integer tabletsPerSheet) { this.tabletsPerSheet = tabletsPerSheet; }

    public Integer getLooseTablets() { return looseTablets != null ? looseTablets : 0; }
    public void setLooseTablets(Integer looseTablets) { this.looseTablets = looseTablets != null ? looseTablets : 0; }

    public Double getPricePerSheet() { return pricePerSheet; }
    public void setPricePerSheet(Double pricePerSheet) { this.pricePerSheet = pricePerSheet; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Calculated helper getters
    public Integer getTotalTablets() {
        if (sheetsCount == null || tabletsPerSheet == null) return getLooseTablets();
        return (sheetsCount * tabletsPerSheet) + getLooseTablets();
    }

    public Double getPricePerTablet() {
        if (pricePerSheet == null || tabletsPerSheet == null || tabletsPerSheet == 0) return 0.0;
        return pricePerSheet / tabletsPerSheet;
    }
}
