package Login.demo.controller;

import Login.demo.dto.ChangePasswordRequest;
import Login.demo.dto.LoginRequest;
import Login.demo.dto.LoginResponse;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.service.JwtService;
import Login.demo.service.UserPrincipal;
import Login.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        // Only Patients are allowed to self-register.
        // Doctors, Pharmacy staff, and Admins are created exclusively by Admin.
        if (user.getRole() != Role.PATIENT) {
            throw new RuntimeException("Public registration is allowed for Patients only. Doctor and Pharmacy accounts must be created by an Admin.");
        }
        return userService.register(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(
                    request.getUsername(),
                    request.getPassword()
            );
            String token = jwtService.generateToken(
                    new UserPrincipal(user),
                    user.getRole().name()
            );

            return ResponseEntity.ok(new LoginResponse(
                    "Login successful",
                    user.getUsername(),
                    user.getRole().name(),
                    token
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials. Please try again."));
        }
    }

    @PostMapping("/user/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        userService.changePassword(
                authentication.getName(),
                request.getCurrentPassword(),
                request.getNewPassword()
        );

        return ResponseEntity.ok(Map.of("message", "Password updated successfully!"));
    }

    @PostMapping("/user/change-username")
    public ResponseEntity<?> changeUsername(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String newUsername = request.get("newUsername");
        User updated = userService.updateUsername(authentication.getName(), newUsername);
        String newToken = jwtService.generateToken(
                new UserPrincipal(updated),
                updated.getRole().name()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Username updated successfully!",
                "username", updated.getUsername(),
                "role", updated.getRole().name(),
                "token", newToken
        ));
    }

    @GetMapping("/test")
    public String test() {
        return "You are authenticated!";
    }
}