package Login.demo.dto;

public class AppointmentRequest {

    private Integer availabilitySlotId;
    private String patientFullName;
    private Integer patientAge;
    private String patientPhone;
    private String patientSex;
    private String healthIssue;

    public AppointmentRequest() {
    }

    public Integer getAvailabilitySlotId() { return availabilitySlotId; }
    public void setAvailabilitySlotId(Integer availabilitySlotId) { this.availabilitySlotId = availabilitySlotId; }

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