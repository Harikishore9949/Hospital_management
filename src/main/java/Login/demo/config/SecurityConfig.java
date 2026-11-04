package Login.demo.config;
import Login.demo.service.MyUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final MyUserDetailsService userDetailsService;
    private final JwtFilter jwtFilter;

    public SecurityConfig(
            MyUserDetailsService userDetailsService,
            JwtFilter jwtFilter) {

        this.userDetailsService = userDetailsService;
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    // ─── CORS ─────────────────────────────────────────────────────────────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*")); // Allow any origin in dev
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Static frontend resources
                        .requestMatchers("/", "/index.html", "/register.html").permitAll()
                        .requestMatchers("/doctor-dashboard.html", "/patient-dashboard.html", "/pharmacy-dashboard.html").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()

                        // WebSocket (SockJS handshake + STOMP frames)
                        .requestMatchers("/ws/**").permitAll()

                        // Public endpoints
                        .requestMatchers("/api/register").permitAll()
                        .requestMatchers("/api/login").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Doctor only
                        .requestMatchers("/api/doctor/**")
                        .hasRole("DOCTOR")

                        // Patient only
                        .requestMatchers("/api/patient/**")
                        .hasRole("PATIENT")

                        // Pharmacy — authenticated users (role checks inside controller)
                        .requestMatchers("/api/pharmacy/**").authenticated()

                        // Lab Center — authenticated users (role checks inside controller / service)
                        .requestMatchers("/api/lab/**").authenticated()

                        // Session management — any authenticated user (doctor or patient)
                        .requestMatchers("/api/session/**").authenticated()

                        // Medical documents — any authenticated user (role checks inside service)
                        .requestMatchers("/api/docs/**").authenticated()

                        // Prescriptions — any authenticated user (role checks inside service)
                        .requestMatchers("/api/prescription/**").authenticated()

                        // Emergency alerts — any authenticated user (role checks inside controller)
                        .requestMatchers("/api/emergency/**").authenticated()

                        // Articles — any authenticated user (role checks inside controller)
                        .requestMatchers("/api/articles/**").authenticated()

                        // Admin — ADMIN role only
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}