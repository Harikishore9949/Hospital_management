package Login.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RoleController {

    @GetMapping("/doctor/test")
    public String doctorAccess() {
        return "Welcome Doctor! You have doctor access.";
    }

    @GetMapping("/patient/test")
    public String patientAccess() {
        return "Welcome Patient! You have patient access.";
    }
}