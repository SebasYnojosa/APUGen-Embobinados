package com.embobinados.apugen_backend.service;

import com.embobinados.apugen_backend.dto.ChangePasswordRequestDTO;
import com.embobinados.apugen_backend.dto.LoginRequestDTO;
import com.embobinados.apugen_backend.dto.LoginResponseDTO;
import com.embobinados.apugen_backend.dto.UserResponseDTO;
import com.embobinados.apugen_backend.entity.User;
import com.embobinados.apugen_backend.exception.UnauthorizedException;
import com.embobinados.apugen_backend.repository.UserRepository;
import com.embobinados.apugen_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponseDTO login(LoginRequestDTO dto) {
        if (dto == null || dto.username() == null || dto.username().isBlank()
                || dto.password() == null || dto.password().isBlank()) {
            throw new UnauthorizedException("Debes ingresar usuario y contraseña.");
        }

        User user = userRepository.findByUsernameIgnoreCase(dto.username().trim())
                .orElseThrow(() -> new UnauthorizedException("Usuario o contraseña incorrectos."));

        if (!user.isActive()) {
            throw new UnauthorizedException("Tu cuenta está desactivada. Contacta al administrador.");
        }

        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new UnauthorizedException("Usuario o contraseña incorrectos.");
        }

        String token = jwtService.generateToken(user);
        return new LoginResponseDTO(token, UserResponseDTO.fromEntity(user));
    }

    public UserResponseDTO getCurrentUser(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UnauthorizedException("Sesión no válida."));
        if (!user.isActive()) {
            throw new UnauthorizedException("Tu cuenta ha sido desactivada.");
        }
        return UserResponseDTO.fromEntity(user);
    }

    @Transactional
    public UserResponseDTO changeOwnPassword(String username, ChangePasswordRequestDTO dto) {
        if (dto == null || dto.currentPassword() == null || dto.currentPassword().isBlank()) {
            throw new RuntimeException("Debes ingresar tu contraseña actual.");
        }
        if (dto.newPassword() == null || dto.newPassword().trim().length() < 6) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado."));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta.");
        }

        if (passwordEncoder.matches(dto.newPassword(), user.getPassword())) {
            throw new RuntimeException("La nueva contraseña debe ser diferente a la actual.");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        user.setMustChangePassword(false);
        User saved = userRepository.save(user);
        return UserResponseDTO.fromEntity(saved);
    }
}
