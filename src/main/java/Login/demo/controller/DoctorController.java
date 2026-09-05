package Login.demo.controller;

import Login.demo.dto.AvailabilityRequest;
import Login.demo.entity.Appointment;
import Login.demo.entity.AvailabilitySlot;
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

    @PostMapping("/availability")
    public AvailabilitySlot createAvailability(
            @RequestBody AvailabilityRequest request,
            Authentication authentication) {

        String username = authentication.getName();

        return doctorService.createAvailability(
                username,
                request
        );
    }
    @GetMapping("/appointments/pending")
    public List<Appointment> getPendingAppointments(
            Authentication authentication) {

        String username = authentication.getName();

        return doctorService.getPendingAppointments(username);
    }
}