package Login.demo.dto;

public class DoctorProfileRequest {

    private String fullName;
    private Integer age;
    private String department;
    private String specialization;
    private String educationBackground;
    private String degrees;
    private String experienceSummary;
    private String memberships;
    private String awards;
    private String additionalNotes;
    private String photoBase64;

    public DoctorProfileRequest() {}

    // ── Getters & Setters ─────────────────────────────────────────────

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
}
