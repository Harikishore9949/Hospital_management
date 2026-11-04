package Login.demo.controller;

import Login.demo.dto.MarkTakenRequest;
import Login.demo.dto.PrescriptionRequest;
import Login.demo.entity.MedicineLog;
import Login.demo.entity.Prescription;
import Login.demo.service.PrescriptionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescription")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    /**
     * Doctor issues a prescription for a specific appointment.
     * POST /api/prescription/issue/{appointmentId}
     */
    @PostMapping("/issue/{appointmentId}")
    public Prescription issuePrescription(
            @PathVariable Integer appointmentId,
            @RequestBody PrescriptionRequest request,
            Authentication authentication) {
        return prescriptionService.issuePrescription(authentication.getName(), appointmentId, request);
    }

    /**
     * Doctor retrieves the prescription for a specific appointment.
     * GET /api/prescription/appointment/{appointmentId}
     */
    @GetMapping("/appointment/{appointmentId}")
    public Prescription getPrescriptionByAppointment(
            @PathVariable Integer appointmentId,
            Authentication authentication) {
        return prescriptionService.getPrescriptionByAppointment(authentication.getName(), appointmentId);
    }

    /**
     * Patient retrieves all their prescriptions.
     * GET /api/prescription/my
     */
    @GetMapping("/my")
    public List<Prescription> getMyPrescriptions(Authentication authentication) {
        return prescriptionService.getPrescriptionsForPatient(authentication.getName());
    }

    /**
     * Delete a prescription by ID.
     * DELETE /api/prescription/{id}
     */
    @DeleteMapping("/{id}")
    public void deletePrescription(@PathVariable Integer id, Authentication authentication) {
        prescriptionService.deletePrescription(id, authentication.getName());
    }

    /**
     * Patient marks a specific medicine dose as taken.
     * POST /api/prescription/taken
     */
    @PostMapping("/taken")
    public MedicineLog markTaken(
            @RequestBody MarkTakenRequest request,
            Authentication authentication) {
        return prescriptionService.markMedicineTaken(authentication.getName(), request);
    }

    /**
     * Patient retrieves all their medicine logs.
     * GET /api/prescription/logs
     */
    @GetMapping("/logs")
    public List<MedicineLog> getMyLogs(Authentication authentication) {
        return prescriptionService.getLogsForPatient(authentication.getName());
    }

    /**
     * Patient creates a custom medication reminder schedule.
     * POST /api/prescription/reminders
     */
    @PostMapping("/reminders")
    public Login.demo.entity.MedicationReminder createReminder(
            @RequestBody Login.demo.dto.CustomReminderRequest request,
            Authentication authentication) {
        return prescriptionService.createCustomReminder(authentication.getName(), request);
    }

    /**
     * Patient fetches their custom medication reminders.
     * GET /api/prescription/reminders
     */
    @GetMapping("/reminders")
    public List<Login.demo.entity.MedicationReminder> getMyReminders(Authentication authentication) {
        return prescriptionService.getCustomReminders(authentication.getName());
    }

    /**
     * Patient deletes a custom medication reminder.
     * DELETE /api/prescription/reminders/{id}
     */
    @DeleteMapping("/reminders/{id}")
    public void deleteReminder(@PathVariable Integer id, Authentication authentication) {
        prescriptionService.deleteCustomReminder(id, authentication.getName());
    }

    /**
     * Patient fetches their medication adherence analytics %.
     * GET /api/prescription/adherence
     */
    @GetMapping("/adherence")
    public java.util.Map<String, Object> getMyAdherence(Authentication authentication) {
        return prescriptionService.getPatientAdherence(authentication.getName());
    }

    /**
     * Doctor fetches adherence alerts for their patients (< 70% adherence).
     * GET /api/prescription/doctor-alerts
     */
    @GetMapping("/doctor-alerts")
    public List<java.util.Map<String, Object>> getDoctorAlerts(Authentication authentication) {
        return prescriptionService.getDoctorAdherenceAlerts(authentication.getName());
    }

    @ExceptionHandler(Exception.class)
    public org.springframework.http.ResponseEntity<?> handleException(Exception e) {
        return org.springframework.http.ResponseEntity.badRequest()
                .body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "An error occurred while processing prescription request"));
    }
}
