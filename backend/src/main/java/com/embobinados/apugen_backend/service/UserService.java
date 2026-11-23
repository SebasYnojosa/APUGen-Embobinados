package com.embobinados.apugen_backend.service;

import com.embobinados.apugen_backend.dto.CreateUserRequestDTO;
import com.embobinados.apugen_backend.dto.ResetPasswordRequestDTO;
import com.embobinados.apugen_backend.dto.UpdateUserRequestDTO;
import com.embobinados.apugen_backend.dto.UserResponseDTO;
import com.embobinados.apugen_backend.entity.User;
import com.embobinados.apugen_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Set<String> VALID_ROLES = Set.of("ADMIN", "USER");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtAsc()
                .stream()
                .map(UserResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public UserResponseDTO createUser(CreateUserRequestDTO dto) {
        if (dto == null || dto.username() == null || dto.username().isBlank()) {
            throw new RuntimeException("El nombre de usuario es obligatorio.");
        }
        String cleanUsername = dto.username().trim();
        if (cleanUsername.contains(" ")) {
            throw new RuntimeException("El nombre de usuario no puede contener espacios.");
        }
        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new RuntimeException("Ya existe un usuario con el nombre: " + cleanUsername);
        }
        if (dto.fullName() == null || dto.fullName().isBlank()) {
            throw new RuntimeException("El nombre completo es obligatorio.");
        }
        if (dto.password() == null || dto.password().length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres.");
        }

        String normalizedRole = normalizeAndValidateRole(dto.role());

        User user = new User();
        user.setUsername(cleanUsername);
        user.setFullName(dto.fullName().trim());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole(normalizedRole);
        user.setActive(true);
        user.setMustChangePassword(dto.mustChangePassword() == null || dto.mustChangePassword());

        return UserResponseDTO.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO updateUser(String id, UpdateUserRequestDTO dto, String currentAdminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el usuario con ID: " + id));

        if (dto.fullName() == null || dto.fullName().isBlank()) {
            throw new RuntimeException("El nombre completo es obligatorio.");
        }
        String newRole = normalizeAndValidateRole(dto.role());

        boolean wasActiveAdmin = "ADMIN".equals(user.getRole()) && user.isActive();
        boolean removingAdminRole = !"ADMIN".equals(newRole);

        if (wasActiveAdmin && removingAdminRole) {
            if (user.getUsername().equalsIgnoreCase(currentAdminUsername)) {
                throw new RuntimeException("No puedes quitarte el rol de administrador a ti mismo.");
            }
            if (userRepository.countByRoleAndActiveTrue("ADMIN") <= 1) {
                throw new RuntimeException("Debe existir al menos un administrador activo en el sistema.");
            }
        }

        user.setFullName(dto.fullName().trim());
        user.setRole(newRole);

        return UserResponseDTO.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO updateUserStatus(String id, boolean active, String currentAdminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el usuario con ID: " + id));

        if (!active) {
            if (user.getUsername().equalsIgnoreCase(currentAdminUsername)) {
                throw new RuntimeException("No puedes desactivar tu propia cuenta.");
            }
            if ("ADMIN".equals(user.getRole()) && user.isActive()
                    && userRepository.countByRoleAndActiveTrue("ADMIN") <= 1) {
                throw new RuntimeException("No se puede desactivar al último administrador activo.");
            }
        }

        user.setActive(active);
        return UserResponseDTO.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO resetPassword(String id, ResetPasswordRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el usuario con ID: " + id));

        if (dto == null || dto.newPassword() == null || dto.newPassword().length() < 6) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        user.setMustChangePassword(dto.mustChangePassword() == null || dto.mustChangePassword());

        return UserResponseDTO.fromEntity(userRepository.save(user));
    }

    private String normalizeAndValidateRole(String role) {
        String normalized = role == null ? "USER" : role.trim().toUpperCase();
        if (!VALID_ROLES.contains(normalized)) {
            throw new RuntimeException("Rol inválido. Debe ser ADMIN o USER.");
        }
        return normalized;
    }
}
