package Login.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"password"})
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "age")
    private Integer age;

    @Column(name = "department")
    private String department;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "education_background", columnDefinition = "TEXT")
    private String educationBackground;

    @Column(name = "degrees", columnDefinition = "TEXT")
    private String degrees;

    @Column(name = "experience_summary", columnDefinition = "TEXT")
    private String experienceSummary;

    @Column(name = "memberships", columnDefinition = "TEXT")
    private String memberships;

    @Column(name = "awards", columnDefinition = "TEXT")
    private String awards;

    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;

    @Column(name = "photo_base64", columnDefinition = "TEXT")
    private String photoBase64;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "consults_count")
    private Integer consultsCount = 0;

    public DoctorProfile() {}

    // ── Getters & Setters ────────────────────────────────────────────

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getEducationBackground() { return educationBackground; }
    public void setEducationBackground(String educationBackground) { this.educationBackground = educationBackground; }

    public String getDegrees() { return degrees; }
    public void setDegrees(String degrees) { this.degrees = degrees; }

    public String getExperienceSummary() { return experienceSummary; }
    public void setExperienceSummary(String experienceSummary) { this.experienceSummary = experienceSummary; }

    public String getMemberships() { return memberships; }
    public void setMemberships(String memberships) { this.memberships = memberships; }

    public String getAwards() { return awards; }
    public void setAwards(String awards) { this.awards = awards; }

    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }

    public String getPhotoBase64() { return photoBase64; }
    public void setPhotoBase64(String photoBase64) { this.photoBase64 = photoBase64; }

    public Integer getLikesCount() { return likesCount != null ? likesCount : 0; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount != null ? likesCount : 0; }

    public Integer getConsultsCount() { return consultsCount != null ? consultsCount : 0; }
    public void setConsultsCount(Integer consultsCount) { this.consultsCount = consultsCount != null ? consultsCount : 0; }
}
