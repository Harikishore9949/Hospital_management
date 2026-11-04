package Login.demo.service;

import Login.demo.dto.MarkTakenRequest;
import Login.demo.dto.PrescriptionRequest;
import Login.demo.entity.*;
import Login.demo.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PrescriptionService {

    private static final DateTimeFormatter TIME_FMT_12 = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    /** Default scheduled times based on timesPerDay with AM/PM */
    private static final Map<Integer, String> DEFAULT_TIMES = Map.of(
            1, "08:00 AM",
            2, "08:00 AM, 08:00 PM",
            3, "08:00 AM, 02:00 PM, 08:00 PM",
            4, "07:00 AM, 12:00 PM, 05:00 PM, 09:00 PM"
    );

    private static LocalTime parseTimeFlexibly(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            return LocalTime.of(8, 0);
        }
        String cleaned = timeStr.trim().toUpperCase();

        DateTimeFormatter[] formatters = new DateTimeFormatter[] {
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("hh:mm a").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("h:mm a").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("hh:mma").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("h:mma").toFormatter(Locale.ENGLISH),
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("H:m")
        };

        for (DateTimeFormatter fmt : formatters) {
            try {
                return LocalTime.parse(cleaned, fmt);
            } catch (Exception ignored) {}
        }

        try {
            String[] parts = cleaned.replaceAll("[^0-9:]", "").split(":");
            if (parts.length >= 2) {
                int h = Integer.parseInt(parts[0]);
                int m = Integer.parseInt(parts[1]);
                if (cleaned.contains("PM") && h < 12) h += 12;
                if (cleaned.contains("AM") && h == 12) h = 0;
                return LocalTime.of(h, m);
            }
        } catch (Exception ignored) {}

        return LocalTime.of(8, 0);
    }

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicineRepository medicineRepository;
    private final MedicineLogRepository medicineLogRepository;
    private final MedicationReminderRepository reminderRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MedicineOrderRepository medicineOrderRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            PrescriptionMedicineRepository medicineRepository,
            MedicineLogRepository medicineLogRepository,
            MedicationReminderRepository reminderRepository,
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            MedicineOrderRepository medicineOrderRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.prescriptionRepository = prescriptionRepository;
        this.medicineRepository = medicineRepository;
        this.medicineLogRepository = medicineLogRepository;
        this.reminderRepository = reminderRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.medicineOrderRepository = medicineOrderRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Issue a prescription ──────────────────────────────────────────────

    public Prescription issuePrescription(String doctorUsername, Integer appointmentId, PrescriptionRequest request) {
        User doctor = findUser(doctorUsername);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctor().getUsername().equals(doctorUsername)) {
            throw new RuntimeException("You are not the doctor for this appointment");
        }

        User patient = appointment.getPatient();

        // If re-issuing for this appointment, reuse existing prescription record to preserve foreign keys
        Prescription prescription = prescriptionRepository.findByAppointment(appointment).orElse(null);
        if (prescription == null) {
            prescription = new Prescription();
            prescription.setDoctor(doctor);
            prescription.setPatient(patient);
            prescription.setAppointment(appointment);
        } else {
            // Delete old medicine logs and medicines first to satisfy foreign key constraints
            if (prescription.getMedicines() != null) {
                for (PrescriptionMedicine oldMed : new ArrayList<>(prescription.getMedicines())) {
                    medicineLogRepository.deleteByMedicine(oldMed);
                    medicineRepository.delete(oldMed);
                }
                prescription.getMedicines().clear();
            }
        }

        prescription.setIssuedAt(LocalDateTime.now());
        Prescription saved = prescriptionRepository.save(prescription);

        for (PrescriptionRequest.MedicineEntry entry : request.getMedicines()) {
            if (entry.getMedicineName() == null || entry.getMedicineName().isBlank()) continue;

            PrescriptionMedicine med = new PrescriptionMedicine();
            med.setPrescription(saved);
            med.setMedicineName(entry.getMedicineName().trim());
            med.setDosage(entry.getDosage() != null ? entry.getDosage().trim() : "");
            med.setTimesPerDay(entry.getTimesPerDay() != null ? entry.getTimesPerDay() : 1);

            // Use doctor-specified times or fall back to default
            String times = entry.getScheduledTimes();
            if (times == null || times.isBlank()) {
                times = DEFAULT_TIMES.getOrDefault(med.getTimesPerDay(), "08:00");
            }
            med.setScheduledTimes(times.trim());
            med.setInstructions(entry.getInstructions() != null ? entry.getInstructions().trim() : "");
            med.setDurationDays(entry.getDurationDays() != null && entry.getDurationDays() > 0 ? entry.getDurationDays() : 5);
            PrescriptionMedicine savedMed = medicineRepository.save(med);
            saved.getMedicines().add(savedMed);
        }

        // Notify patient in real-time via WebSockets
        try {
            Map<String, Object> payload = Map.of(
                    "type", "PRESCRIPTION_ISSUED",
                    "appointmentId", appointmentId,
                    "doctorName", doctor.getUsername(),
                    "patientUsername", patient.getUsername(),
                    "message", "Dr. " + doctor.getUsername() + " has issued a new prescription for your appointment."
            );
            messagingTemplate.convertAndSend("/topic/patient-notifications/" + patient.getUsername(), payload);
            messagingTemplate.convertAndSend("/topic/patient-notifications", payload);
        } catch (Exception e) {
            // Non-blocking
        }

        return saved;
    }

    // ── Get prescriptions for patient ─────────────────────────────────────

    public List<Prescription> getPrescriptionsForPatient(String patientUsername) {
        User patient = findUser(patientUsername);
        return prescriptionRepository.findByPatientOrderByIssuedAtDesc(patient);
    }

    // ── Get prescription for a specific appointment (doctor view) ─────────

    public Prescription getPrescriptionByAppointment(String doctorUsername, Integer appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        if (!appointment.getDoctor().getUsername().equals(doctorUsername)) {
            throw new RuntimeException("Access denied");
        }
        return prescriptionRepository.findByAppointment(appointment)
                .orElseThrow(() -> new RuntimeException("No prescription issued for this appointment"));
    }

    // ── Mark a medicine dose as taken ─────────────────────────────────────

    public MedicineLog markMedicineTaken(String patientUsername, MarkTakenRequest request) {
        User patient = findUser(patientUsername);

        PrescriptionMedicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        // Verify this medicine belongs to the patient's prescription
        if (!medicine.getPrescription().getPatient().getUsername().equals(patientUsername)) {
            throw new RuntimeException("Access denied");
        }

        LocalDate logDate = request.getLogDate() != null ? request.getLogDate() : LocalDate.now();
        String scheduledTimeStr = request.getScheduledTime();

        // Check for duplicate
        if (medicineLogRepository.existsByMedicineAndPatientAndLogDateAndScheduledTime(
                medicine, patient, logDate, scheduledTimeStr)) {
            throw new RuntimeException("You have already marked this dose as taken today.");
        }

        // ── Time window evaluation ──────────────────────────────────────────
        LocalTime scheduledTime = parseTimeFlexibly(scheduledTimeStr);
        LocalTime now = LocalTime.now();
        LocalTime windowStart = scheduledTime.minusHours(1);
        LocalTime windowEnd   = scheduledTime.plusHours(1);

        boolean inWindow;
        if (windowStart.isBefore(windowEnd)) {
            inWindow = !now.isBefore(windowStart) && !now.isAfter(windowEnd);
        } else {
            inWindow = !now.isBefore(windowStart) || !now.isAfter(windowEnd);
        }

        MedicineLog log = new MedicineLog();
        log.setMedicine(medicine);
        log.setPatient(patient);
        log.setScheduledTime(scheduledTimeStr);
        log.setLogDate(logDate);
        log.setTakenAt(LocalDateTime.now());
        log.setStatus(inWindow ? "ON_TIME" : "TAKEN");

        return medicineLogRepository.save(log);
    }

    // ── Get medicine logs for patient ─────────────────────────────────────

    public List<MedicineLog> getLogsForPatient(String patientUsername) {
        User patient = findUser(patientUsername);
        return medicineLogRepository.findByPatientOrderByLogDateDescTakenAtDesc(patient);
    }

    // ── Custom Medication Reminders (Patient Created) ──────────────────────

    public MedicationReminder createCustomReminder(String patientUsername, Login.demo.dto.CustomReminderRequest req) {
        User patient = findUser(patientUsername);

        if (req.getMedicineName() == null || req.getMedicineName().isBlank()) {
            throw new RuntimeException("Medicine name is required.");
        }
        if (req.getScheduledTimes() == null || req.getScheduledTimes().isBlank()) {
            throw new RuntimeException("Scheduled time is required.");
        }

        MedicationReminder reminder = new MedicationReminder();
        reminder.setPatient(patient);
        reminder.setMedicineName(req.getMedicineName().trim());
        reminder.setDosage(req.getDosage() != null ? req.getDosage().trim() : "");
        reminder.setScheduleType(req.getScheduleType() != null ? req.getScheduleType().trim() : "DAILY");
        reminder.setScheduledTimes(req.getScheduledTimes().trim());
        reminder.setInstructions(req.getInstructions() != null ? req.getInstructions().trim() : "");
        reminder.setCreatedAt(LocalDateTime.now());

        return reminderRepository.save(reminder);
    }

    public List<MedicationReminder> getCustomReminders(String patientUsername) {
        User patient = findUser(patientUsername);
        return reminderRepository.findByPatientOrderByCreatedAtDesc(patient);
    }

    public void deleteCustomReminder(Integer id, String patientUsername) {
        MedicationReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));
        if (!reminder.getPatient().getUsername().equals(patientUsername)) {
            throw new RuntimeException("Not authorized");
        }
        reminderRepository.delete(reminder);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deletePrescription(Integer id, String username) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        User user = findUser(username);

        boolean isPatient = prescription.getPatient().getUsername().equals(username);
        boolean isDoctor = prescription.getDoctor() != null && prescription.getDoctor().getUsername().equals(username);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole().name());

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new RuntimeException("Not authorized to delete this prescription");
        }

        if (prescription.getMedicines() != null) {
            for (PrescriptionMedicine med : prescription.getMedicines()) {
                medicineLogRepository.deleteByMedicine(med);
            }
        }
        // Also remove any medicine orders tied to this prescription so foreign key constraint does not fail
        List<MedicineOrder> orders = medicineOrderRepository.findByPrescription(prescription);
        if (orders != null && !orders.isEmpty()) {
            medicineOrderRepository.deleteAll(orders);
        }
        prescriptionRepository.delete(prescription);
    }

    // ── Adherence Analytics & Missed Dose Tracking ────────────────────────

    public Map<String, Object> getPatientAdherence(String patientUsername) {
        User patient = findUser(patientUsername);
        List<Prescription> prescriptions = prescriptionRepository.findByPatientOrderByIssuedAtDesc(patient);
        List<MedicationReminder> customReminders = reminderRepository.findByPatientOrderByCreatedAtDesc(patient);
        List<MedicineLog> logs = medicineLogRepository.findByPatientOrderByLogDateDescTakenAtDesc(patient);

        int totalExpectedDoses = 0;
        for (Prescription p : prescriptions) {
            for (PrescriptionMedicine m : p.getMedicines()) {
                String[] times = m.getScheduledTimes().split(",");
                int days = m.getDurationDays() != null && m.getDurationDays() > 0 ? m.getDurationDays() : 5;
                totalExpectedDoses += Math.max(1, times.length) * days;
            }
        }
        for (MedicationReminder r : customReminders) {
            String[] times = r.getScheduledTimes().split(",");
            totalExpectedDoses += Math.max(1, times.length) * 5;
        }

        int takenDoses = logs.size();
        int effectiveExpected = Math.max(takenDoses, totalExpectedDoses);
        int adherencePercent = effectiveExpected > 0 ? (int) Math.round(((double) takenDoses / effectiveExpected) * 100) : 100;
        if (adherencePercent > 100) adherencePercent = 100;

        boolean alertTriggered = adherencePercent < 70 && effectiveExpected > 0;

        return Map.of(
                "patientUsername", patientUsername,
                "adherencePercent", adherencePercent,
                "takenDoses", takenDoses,
                "totalExpectedDoses", effectiveExpected,
                "alertTriggered", alertTriggered,
                "status", adherencePercent >= 85 ? "EXCELLENT" : (adherencePercent >= 70 ? "GOOD" : "NEEDS_ATTENTION")
        );
    }

    public List<Map<String, Object>> getDoctorAdherenceAlerts(String doctorUsername) {
        User doctor = findUser(doctorUsername);
        List<Appointment> doctorAppts = appointmentRepository.findByDoctorOrderByRequestedAtDesc(doctor);

        List<String> patientUsernames = doctorAppts.stream()
                .map(a -> a.getPatient().getUsername())
                .distinct()
                .toList();

        List<Map<String, Object>> alerts = new java.util.ArrayList<>();
        for (String pUsername : patientUsernames) {
            Map<String, Object> adherence = getPatientAdherence(pUsername);
            boolean alertTriggered = (boolean) adherence.get("alertTriggered");
            if (alertTriggered) {
                alerts.add(Map.of(
                        "patientUsername", pUsername,
                        "adherencePercent", adherence.get("adherencePercent"),
                        "takenDoses", adherence.get("takenDoses"),
                        "totalExpectedDoses", adherence.get("totalExpectedDoses"),
                        "message", "⚠️ Patient @" + pUsername + "'s medication adherence is below 70% (" + adherence.get("adherencePercent") + "%)."
                ));
            }
        }
        return alerts;
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }
}
