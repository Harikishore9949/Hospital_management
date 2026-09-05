package Login.demo.controller;

import Login.demo.dto.AppointmentRequest;
import Login.demo.entity.Appointment;
import Login.demo.entity.AvailabilitySlot;
import Login.demo.service.AppointmentService;
import Login.demo.service.DoctorService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;

    public PatientController(
            DoctorService doctorService,
            AppointmentService appointmentService) {

        this.doctorService = doctorService;
        this.appointmentService = appointmentService;
    }

    @GetMapping("/doctors/{doctorId}/availability")
    public List<AvailabilitySlot> getAvailableSlots(
            @PathVariable Integer doctorId) {

        return doctorService.getAvailableSlots(doctorId);
    }

    @PostMapping("/appointments")
    public Appointment bookAppointment(
            @RequestBody AppointmentRequest request,
            Authentication authentication) {

        String username = authentication.getName();

        return appointmentService.bookAppointment(
                username,
                request
        );
    }
}