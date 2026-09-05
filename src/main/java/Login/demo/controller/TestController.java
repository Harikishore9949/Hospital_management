package Login.demo.controller;

import Login.demo.entity.User;
import Login.demo.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TestController {

    private final UserRepository userRepository;

    public TestController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/test/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }
}