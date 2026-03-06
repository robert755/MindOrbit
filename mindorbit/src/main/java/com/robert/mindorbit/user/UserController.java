package com.robert.mindorbit.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public User login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }

}
