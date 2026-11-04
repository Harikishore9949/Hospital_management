package Login.demo.dto;

import java.time.LocalDate;

public class MarkTakenRequest {

    private Integer medicineId;
    /** Scheduled time string, e.g. "08:00" */
    private String scheduledTime;
    /** Date for which this dose is being marked, ISO format "yyyy-MM-dd" */
    private LocalDate logDate;

    public Integer getMedicineId() { return medicineId; }
    public void setMedicineId(Integer medicineId) { this.medicineId = medicineId; }

    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
}
