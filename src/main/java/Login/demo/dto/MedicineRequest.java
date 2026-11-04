package Login.demo.dto;

public class MedicineRequest {

    private String medicineName;
    private Integer sheetsCount;
    private Integer tabletsPerSheet;
    private Double pricePerSheet;

    public MedicineRequest() {}

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public Integer getSheetsCount() { return sheetsCount; }
    public void setSheetsCount(Integer sheetsCount) { this.sheetsCount = sheetsCount; }

    public Integer getTabletsPerSheet() { return tabletsPerSheet; }
    public void setTabletsPerSheet(Integer tabletsPerSheet) { this.tabletsPerSheet = tabletsPerSheet; }

    public Double getPricePerSheet() { return pricePerSheet; }
    public void setPricePerSheet(Double pricePerSheet) { this.pricePerSheet = pricePerSheet; }
}
