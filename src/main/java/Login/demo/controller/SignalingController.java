package Login.demo.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * WebRTC Signaling Controller (STOMP over WebSocket).
 *
 * WebRTC signals  : /app/signal/{roomId}  →  /topic/room/{roomId}
 * Notifications   : /app/notify/{roomId}  →  /topic/notify/{roomId}
 */
@Controller
public class SignalingController {

    private final SimpMessagingTemplate broker;

    public SignalingController(SimpMessagingTemplate broker) {
        this.broker = broker;
    }

    /** Relay WebRTC signaling messages (offer/answer/candidate/end) */
    @MessageMapping("/signal/{roomId}")
    public void relaySignal(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> signal) {
        broker.convertAndSend("/topic/room/" + roomId, signal);
    }

    /** Relay presence/notification messages (joined, screen share, hand raise) */
    @MessageMapping("/notify/{roomId}")
    public void relayNotification(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> notification) {
        broker.convertAndSend("/topic/notify/" + roomId, notification);
    }
}
