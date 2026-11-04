package Login.demo.dto;

public class CustomReminderRequest {
    private String medicineName;
    private String dosage;
    private String scheduleType; // DAILY, ALTERNATE_DAYS, CUSTOM
    private String scheduledTimes; // e.g. "09:00,21:00"
    private String instructions;

    public CustomReminderRequest() {}

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getScheduleType() { return scheduleType; }
    public void setScheduleType(String scheduleType) { this.scheduleType = scheduleType; }

    public String getScheduledTimes() { return scheduledTimes; }
    public void setScheduledTimes(String scheduledTimes) { this.scheduledTimes = scheduledTimes; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
}
