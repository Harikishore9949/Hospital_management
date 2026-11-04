package Login.demo.controller;

import Login.demo.dto.EmergencyRequest;
import Login.demo.entity.EmergencyAlert;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.repository.EmergencyAlertRepository;
import Login.demo.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public EmergencyController(EmergencyAlertRepository alertRepository,
                                UserRepository userRepository,
                                SimpMessagingTemplate messagingTemplate) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Patient raises emergency ──────────────────────────────────────────

    @PostMapping("/raise")
    public EmergencyAlert raiseEmergency(
            @RequestBody EmergencyRequest request,
            Authentication authentication) {

        User patient = findUser(authentication.getName());

        EmergencyAlert alert = new EmergencyAlert();
        alert.setPatient(patient);
        alert.setSymptoms(request.getSymptoms() != null ? request.getSymptoms().trim() : "");
        alert.setSeverity(request.getSeverity() != null ? request.getSeverity() : "HIGH");
        alert.setLocation(request.getLocation() != null ? request.getLocation().trim() : "");
        alert.setStatus("OPEN");
        alert.setCreatedAt(LocalDateTime.now());

        EmergencyAlert saved = alertRepository.save(alert);

        // Broadcast to all connected doctors via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/emergency", saved);
        } catch (Exception e) {
            System.err.println("WebSocket broadcast error: " + e.getMessage());
        }

        return saved;
    }

    // ── Doctor accepts emergency ──────────────────────────────────────────

    @PostMapping("/{id}/accept")
    public EmergencyAlert acceptEmergency(
            @PathVariable Integer id,
            Authentication authentication) {

        User doctor = findUser(authentication.getName());
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Only doctors can accept emergency alerts.");
        }

        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found."));

        if (!"OPEN".equals(alert.getStatus())) {
            throw new RuntimeException("This alert is no longer open.");
        }

        alert.setStatus("ACCEPTED");
        alert.setAcceptedBy(doctor);
        alert.setAcceptedAt(LocalDateTime.now());
        EmergencyAlert saved = alertRepository.save(alert);

        // Notify the patient specifically
        messagingTemplate.convertAndSend("/topic/emergency/" + id + "/status", saved);

        return saved;
    }

    // ── Doctor resolves emergency ─────────────────────────────────────────

    @PostMapping("/{id}/resolve")
    public EmergencyAlert resolveEmergency(
            @PathVariable Integer id,
            Authentication authentication) {

        User doctor = findUser(authentication.getName());
        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found."));

        if (!doctor.getUsername().equals(alert.getAcceptedBy() != null ? alert.getAcceptedBy().getUsername() : "")) {
            throw new RuntimeException("Only the accepting doctor can resolve this alert.");
        }

        alert.setStatus("RESOLVED");
        alert.setResolvedAt(LocalDateTime.now());
        EmergencyAlert saved = alertRepository.save(alert);

        messagingTemplate.convertAndSend("/topic/emergency/" + id + "/status", saved);
        return saved;
    }

    // ── Patient cancels own emergency ─────────────────────────────────────

    @PostMapping("/{id}/cancel")
    public EmergencyAlert cancelEmergency(
            @PathVariable Integer id,
            Authentication authentication) {

        User patient = findUser(authentication.getName());
        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found."));

        if (!patient.getUsername().equals(alert.getPatient().getUsername())) {
            throw new RuntimeException("You can only cancel your own alerts.");
        }

        alert.setStatus("CANCELLED");
        EmergencyAlert saved = alertRepository.save(alert);

        messagingTemplate.convertAndSend("/topic/emergency/" + id + "/status", saved);
        return saved;
    }

    // ── Doctor gets all open alerts ───────────────────────────────────────

    @GetMapping("/active")
    public List<EmergencyAlert> getActiveAlerts(Authentication authentication) {
        return alertRepository.findByStatusOrderByCreatedAtDesc("OPEN");
    }

    // ── Get single alert ──────────────────────────────────────────────────

    @GetMapping("/{id}")
    public EmergencyAlert getAlert(@PathVariable Integer id, Authentication authentication) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found."));
    }

    // ── Patient gets own alerts ───────────────────────────────────────────

    @GetMapping("/my")
    public List<EmergencyAlert> getMyAlerts(Authentication authentication) {
        User patient = findUser(authentication.getName());
        return alertRepository.findByPatientOrderByCreatedAtDesc(patient);
    }

    // ── Doctor gets alerts they accepted ─────────────────────────────────

    @GetMapping("/accepted")
    public List<EmergencyAlert> getAcceptedByMe(Authentication authentication) {
        User doctor = findUser(authentication.getName());
        return alertRepository.findByAcceptedByOrderByCreatedAtDesc(doctor);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }
}
