package Login.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker publishing to /topic/...
        // Covers: /topic/emergency (new alerts), /topic/emergency/{id}/status,
        //         /topic/emergency/{id}/chat, and WebRTC signaling channels
        registry.enableSimpleBroker("/topic");
        // Messages from clients to @MessageMapping methods are prefixed /app
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint — SockJS fallback enabled for broader browser support
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
