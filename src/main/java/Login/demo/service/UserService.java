package Login.demo.service;

import Login.demo.entity.User;
import Login.demo.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    // REGISTER
    public User register(User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required.");
        }
        String cleanedUsername = user.getUsername().trim();
        if (userRepository.findByUsername(cleanedUsername).isPresent()) {
            throw new RuntimeException("Username '" + cleanedUsername + "' already exists. Please choose a different username.");
        }
        user.setUsername(cleanedUsername);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // LOGIN
    public User login(String username, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        username != null ? username.trim() : "",
                        password
                )
        );

        return userRepository.findByUsername(username != null ? username.trim() : "")
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));
    }

    // CHANGE PASSWORD
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password.");
        }

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long.");
        }

        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
    }

    // UPDATE USERNAME
    public User updateUsername(String currentUsername, String newUsername) {
        if (newUsername == null || newUsername.trim().length() < 3) {
            throw new RuntimeException("New username must be at least 3 characters long.");
        }
        String trimmed = newUsername.trim();
        if (userRepository.findByUsername(trimmed).isPresent() && !trimmed.equalsIgnoreCase(currentUsername)) {
            throw new RuntimeException("Username '" + trimmed + "' is already taken.");
        }
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername(trimmed);
        return userRepository.save(user);
    }
}