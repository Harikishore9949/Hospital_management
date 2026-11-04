package Login.demo.service;

import Login.demo.entity.*;
import Login.demo.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class VideoSessionService {

    private final VideoSessionRepository sessionRepo;
    private final AppointmentRepository appointmentRepo;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public VideoSessionService(VideoSessionRepository sessionRepo,
                               AppointmentRepository appointmentRepo,
                               UserRepository userRepo,
                               SimpMessagingTemplate messagingTemplate) {
        this.sessionRepo = sessionRepo;
        this.appointmentRepo = appointmentRepo;
        this.userRepo = userRepo;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Doctor starts a session for an accepted appointment.
     * Idempotent — returns existing active session if one already exists.
     * If a previous (ended) session exists for this appointment, reactivates it
     * with a fresh roomId instead of inserting a duplicate row (avoids unique-key violation).
     */
    @Transactional
    public Map<String, Object> startSession(Integer appointmentId, String doctorUsername) {
        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));

        // Must be doctor's own appointment
        if (!appt.getDoctor().getUsername().equals(doctorUsername)) {
            throw new RuntimeException("Not authorized for this appointment.");
        }
        if (appt.getStatus() != AppointmentStatus.ACCEPTED) {
            throw new RuntimeException("Appointment must be ACCEPTED to start a session.");
        }
        if (!"PAID".equalsIgnoreCase(appt.getPaymentStatus())) {
            throw new RuntimeException("Cannot start session: Patient consultation fee has not been paid yet.");
        }

        String patientUsername = appt.getPatient().getUsername();
        String doctorName = appt.getDoctor().getUsername();

        // Return existing active session if present
        var activeExisting = sessionRepo.findByAppointment_IdAndActiveTrue(appointmentId);
        if (activeExisting.isPresent()) {
            VideoSession s = activeExisting.get();
            notifyPatientSessionStarted(patientUsername, doctorName, appointmentId, s.getRoomId());
            return Map.of("roomId", s.getRoomId(), "appointmentId", appointmentId, "active", true);
        }

        // Reuse any prior (ended) session row to avoid the unique appointment_id constraint
        var anyExisting = sessionRepo.findByAppointment_Id(appointmentId);
        VideoSession session = anyExisting.orElse(new VideoSession());
        session.setRoomId(UUID.randomUUID().toString());
        session.setAppointment(appt);
        session.setStartedAt(LocalDateTime.now());
        session.setEndedAt(null);
        session.setActive(true);
        sessionRepo.save(session);

        notifyPatientSessionStarted(patientUsername, doctorName, appointmentId, session.getRoomId());

        return Map.of("roomId", session.getRoomId(), "appointmentId", appointmentId, "active", true);
    }

    private void notifyPatientSessionStarted(String patientUsername, String doctorName, Integer appointmentId, String roomId) {
        try {
            Map<String, Object> payload = Map.of(
                    "type", "SESSION_STARTED",
                    "appointmentId", appointmentId,
                    "roomId", roomId,
                    "doctorName", doctorName,
                    "patientUsername", patientUsername,
                    "message", "Dr. " + doctorName + " has started your consultation session and is waiting for you."
            );
            messagingTemplate.convertAndSend("/topic/patient-notifications/" + patientUsername, payload);
            messagingTemplate.convertAndSend("/topic/patient-notifications", payload);
        } catch (Exception e) {
            // Non-blocking log/ignore if STOMP broadcast fails
        }
    }

    /**
     * Either party ends the session. Marks session inactive.
     */
    @Transactional
    public Map<String, Object> endSession(String roomId, String username) {
        VideoSession session = sessionRepo.findByRoomIdAndActiveTrue(roomId)
                .orElseThrow(() -> new RuntimeException("Active session not found: " + roomId));

        Appointment appt = session.getAppointment();
        boolean isDoctor  = appt.getDoctor().getUsername().equals(username);
        boolean isPatient = appt.getPatient().getUsername().equals(username);

        if (!isDoctor && !isPatient) {
            throw new RuntimeException("Not authorized to end this session.");
        }

        session.setActive(false);
        session.setEndedAt(LocalDateTime.now());
        sessionRepo.save(session);

        try {
            Map<String, Object> payload = Map.of(
                    "type", "SESSION_ENDED",
                    "appointmentId", appt.getId(),
                    "roomId", roomId
            );
            messagingTemplate.convertAndSend("/topic/patient-notifications/" + appt.getPatient().getUsername(), payload);
            messagingTemplate.convertAndSend("/topic/patient-notifications", payload);
        } catch (Exception e) {
            // Non-blocking log/ignore if STOMP broadcast fails
        }

        return Map.of("roomId", roomId, "active", false, "endedAt", session.getEndedAt().toString());
    }

    /**
     * Check session status for an appointment. Returns roomId if active.
     */
    public Map<String, Object> getSessionStatus(Integer appointmentId, String username) {
        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        boolean isDoctor  = appt.getDoctor().getUsername().equals(username);
        boolean isPatient = appt.getPatient().getUsername().equals(username);
        if (!isDoctor && !isPatient) {
            throw new RuntimeException("Not authorized.");
        }

        // Check if slot end time has passed
        AvailabilitySlot slot = appt.getAvailabilitySlot();
        if (slot != null && slot.getDate() != null && slot.getEndTime() != null) {
            LocalDateTime slotEnd = LocalDateTime.of(slot.getDate(), slot.getEndTime());
            if (LocalDateTime.now().isAfter(slotEnd)) {
                var session = sessionRepo.findByAppointment_IdAndActiveTrue(appointmentId);
                if (session.isPresent()) {
                    VideoSession s = session.get();
                    s.setActive(false);
                    s.setEndedAt(LocalDateTime.now());
                    sessionRepo.save(s);
                    try {
                        Map<String, Object> payload = Map.of(
                                "type", "SESSION_ENDED",
                                "appointmentId", appt.getId(),
                                "roomId", s.getRoomId()
                        );
                        messagingTemplate.convertAndSend("/topic/patient-notifications/" + appt.getPatient().getUsername(), payload);
                        messagingTemplate.convertAndSend("/topic/patient-notifications", payload);
                    } catch (Exception e) { /* ignore */ }
                }
                return Map.of("active", false, "reason", "EXPIRED");
            }
        }

        var session = sessionRepo.findByAppointment_IdAndActiveTrue(appointmentId);
        if (session.isPresent()) {
            return Map.of("active", true, "roomId", session.get().getRoomId());
        }
        return Map.of("active", false);
    }

    /**
     * Validate a roomId before joining — ensure caller is part of the appointment.
     */
    public Map<String, Object> validateRoom(String roomId, String username) {
        VideoSession session = sessionRepo.findByRoomIdAndActiveTrue(roomId)
                .orElseThrow(() -> new RuntimeException("Session not active or not found."));

        Appointment appt = session.getAppointment();
        boolean isDoctor  = appt.getDoctor().getUsername().equals(username);
        boolean isPatient = appt.getPatient().getUsername().equals(username);
        if (!isDoctor && !isPatient) {
            throw new RuntimeException("Not authorized to join this room.");
        }

        return Map.of(
                "roomId", roomId,
                "active", true,
                "role", isDoctor ? "DOCTOR" : "PATIENT",
                "appointmentId", appt.getId(),
                "doctorName", appt.getDoctor().getUsername(),
                "patientName", appt.getPatient().getUsername()
        );
    }

    public boolean isSessionActive(String roomId) {
        return sessionRepo.findByRoomIdAndActiveTrue(roomId).isPresent();
    }

    /**
     * Get appointmentId from an active roomId (used by document access check).
     */
    public Integer getAppointmentIdForRoom(String roomId) {
        return sessionRepo.findByRoomIdAndActiveTrue(roomId)
                .map(s -> s.getAppointment().getId())
                .orElse(null);
    }
}
