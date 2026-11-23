package com.embobinados.apugen_backend.config;

import com.embobinados.apugen_backend.entity.User;
import com.embobinados.apugen_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.full-name:Administrador}")
    private String adminFullName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername(adminUsername.trim());
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setFullName(adminFullName.trim());
            admin.setRole("ADMIN");
            admin.setActive(true);
            admin.setMustChangePassword(false);
            userRepository.save(admin);
            log.info("Usuario administrador inicial '{}' creado automáticamente.", admin.getUsername());
        }
    }
}
