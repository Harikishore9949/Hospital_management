package Login.demo.controller;

import Login.demo.dto.LoginRequest;
import Login.demo.dto.LoginResponse;
import Login.demo.entity.User;
import Login.demo.service.JwtService;
import Login.demo.service.UserPrincipal;
import Login.demo.service.UserService;
import org.springframework.web.bind.annotation.*;

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
        return userService.register(user);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {

        User user = userService.login(
                request.getUsername(),
                request.getPassword()
        );
        String token = jwtService.generateToken(
                new UserPrincipal(user),
                user.getRole().name()
        );

        return new LoginResponse(
                "Login successful",
                user.getUsername(),
                user.getRole().name(),
                token
        );
    }
    @GetMapping("/test")
    public String test() {
        return "You are authenticated!";
    }
}