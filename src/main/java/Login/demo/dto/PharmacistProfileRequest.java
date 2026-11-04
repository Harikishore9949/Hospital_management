package Login.demo.dto;

public class PharmacistProfileRequest {
    private String fullName;
    private String email;
    private String phoneNumber;
    private String educationDetails;
    private Integer experienceYears;
    private String experienceSummary;
    private String offlineStoreName;
    private String licenseNumber;
    private String storeAddress;

    public PharmacistProfileRequest() {}

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEducationDetails() { return educationDetails; }
    public void setEducationDetails(String educationDetails) { this.educationDetails = educationDetails; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getExperienceSummary() { return experienceSummary; }
    public void setExperienceSummary(String experienceSummary) { this.experienceSummary = experienceSummary; }

    public String getOfflineStoreName() { return offlineStoreName; }
    public void setOfflineStoreName(String offlineStoreName) { this.offlineStoreName = offlineStoreName; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getStoreAddress() { return storeAddress; }
    public void setStoreAddress(String storeAddress) { this.storeAddress = storeAddress; }
}

