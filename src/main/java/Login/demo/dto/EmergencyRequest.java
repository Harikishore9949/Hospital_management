package Login.demo.dto;

public class EmergencyRequest {
    private String symptoms;
    private String severity;  // CRITICAL / HIGH / MEDIUM
    private String location;

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
