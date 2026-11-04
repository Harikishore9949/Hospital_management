package Login.demo.dto;

import java.util.List;

public class PrescriptionRequest {

    private List<MedicineEntry> medicines;

    public List<MedicineEntry> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineEntry> medicines) { this.medicines = medicines; }

    public static class MedicineEntry {
        private String medicineName;
        private String dosage;
        private Integer timesPerDay;
        /** Comma-separated HH:mm values, e.g. "08:00,14:00,20:00" */
        private String scheduledTimes;
        private String instructions;
        private Integer durationDays;

        public String getMedicineName() { return medicineName; }
        public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public Integer getTimesPerDay() { return timesPerDay; }
        public void setTimesPerDay(Integer timesPerDay) { this.timesPerDay = timesPerDay; }

        public String getScheduledTimes() { return scheduledTimes; }
        public void setScheduledTimes(String scheduledTimes) { this.scheduledTimes = scheduledTimes; }

        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }

        public Integer getDurationDays() { return durationDays; }
        public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    }
}
