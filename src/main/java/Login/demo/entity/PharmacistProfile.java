package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pharmacist_profiles")
public class PharmacistProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"password"})
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "education_details", columnDefinition = "TEXT")
    private String educationDetails;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "experience_summary", columnDefinition = "TEXT")
    private String experienceSummary;

    @Column(name = "offline_store_name")
    private String offlineStoreName;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "store_address", columnDefinition = "TEXT")
    private String storeAddress;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PharmacistProfile() {}

    public PharmacistProfile(User user) {
        this.user = user;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    // ─── Getters & Setters ───────────────────────────────────────────────

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

