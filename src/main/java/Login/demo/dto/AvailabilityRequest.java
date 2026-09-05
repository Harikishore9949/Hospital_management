package Login.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AvailabilityRequest {

    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    public AvailabilityRequest() {
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}