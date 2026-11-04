package Login.demo.controller;

import Login.demo.service.VideoSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/session")
public class VideoSessionController {

    private final VideoSessionService sessionService;

    public VideoSessionController(VideoSessionService sessionService) {
        this.sessionService = sessionService;
    }

    /** Doctor starts a session — returns roomId */
    @PostMapping("/start/{appointmentId}")
    public ResponseEntity<Map<String, Object>> startSession(
            @PathVariable Integer appointmentId,
            Authentication auth) {
        try {
            Map<String, Object> result = sessionService.startSession(appointmentId, auth.getName());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Either party ends the session */
    @PostMapping("/end/{roomId}")
    public ResponseEntity<Map<String, Object>> endSession(
            @PathVariable String roomId,
            Authentication auth) {
        try {
            Map<String, Object> result = sessionService.endSession(roomId, auth.getName());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Patient/Doctor polls to see if a session is active for their appointment */
    @GetMapping("/status/{appointmentId}")
    public ResponseEntity<Map<String, Object>> getStatus(
            @PathVariable Integer appointmentId,
            Authentication auth) {
        try {
            Map<String, Object> result = sessionService.getSessionStatus(appointmentId, auth.getName());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Validate roomId and return session metadata before joining */
    @GetMapping("/check/{roomId}")
    public ResponseEntity<Map<String, Object>> checkRoom(
            @PathVariable String roomId,
            Authentication auth) {
        try {
            Map<String, Object> result = sessionService.validateRoom(roomId, auth.getName());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
