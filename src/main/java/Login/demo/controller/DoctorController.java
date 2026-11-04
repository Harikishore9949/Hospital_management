package Login.demo.controller;

import Login.demo.dto.AvailabilityRequest;
import Login.demo.dto.DoctorProfileRequest;
import Login.demo.entity.Appointment;
import Login.demo.entity.AvailabilitySlot;
import Login.demo.entity.DoctorProfile;
import Login.demo.service.DoctorService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // Get the doctor's own profile
    @GetMapping("/profile")
    public DoctorProfile getMyProfile(Authentication authentication) {
        return doctorService.getMyProfile(authentication.getName());
    }

    // Create or update the doctor's profile
    @PutMapping("/profile")
    public DoctorProfile saveProfile(
            @RequestBody DoctorProfileRequest request,
            Authentication authentication) {
        return doctorService.saveProfile(authentication.getName(), request);
    }

    // Create a new availability slot
    @PostMapping("/availability")
    public AvailabilitySlot createAvailability(
            @RequestBody AvailabilityRequest request,
            Authentication authentication) {

        return doctorService.createAvailability(authentication.getName(), request);
    }

    // Get doctor's own slots from DB (persisted, not in-session)
    @GetMapping("/slots")
    public List<AvailabilitySlot> getMySlots(Authentication authentication) {
        return doctorService.getMySlots(authentication.getName());
    }

    // Get all appointment requests for this doctor
    @GetMapping("/appointments")
    public List<Appointment> getAllAppointments(Authentication authentication) {
        return doctorService.getAllAppointments(authentication.getName());
    }

    // Get only pending appointments
    @GetMapping("/appointments/pending")
    public List<Appointment> getPendingAppointments(Authentication authentication) {
        return doctorService.getPendingAppointments(authentication.getName());
    }

    // Accept an appointment
    @PostMapping("/appointments/{id}/accept")
    public Appointment acceptAppointment(
            @PathVariable Integer id,
            Authentication authentication) {
        return doctorService.acceptAppointment(authentication.getName(), id);
    }

    // Reject an appointment (slot becomes available again; no refund needed if unpaid)
    @PostMapping("/appointments/{id}/reject")
    public Appointment rejectAppointment(
            @PathVariable Integer id,
            Authentication authentication) {
        return doctorService.rejectAppointment(authentication.getName(), id);
    }

    // Cancel an appointment — if patient already paid, mandatory full refund is automatically issued
    @PostMapping("/appointments/{id}/cancel")
    public Appointment cancelAppointment(
            @PathVariable Integer id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        String reason = body != null ? body.get("reason") : "Doctor unavailable";
        return doctorService.cancelAppointmentWithRefund(authentication.getName(), id, reason);
    }

    // Delete an unbooked availability slot
    @DeleteMapping("/availability/{slotId}")
    public void deleteAvailabilitySlot(
            @PathVariable Integer slotId,
            Authentication authentication) {
        doctorService.deleteAvailabilitySlot(authentication.getName(), slotId);
    }
}