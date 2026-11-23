package com.embobinados.apugen_backend.dto;

import com.embobinados.apugen_backend.entity.User;

import java.time.LocalDateTime;

public record UserResponseDTO(
        String id,
        String username,
        String fullName,
        String role,
        boolean active,
        boolean mustChangePassword,
        LocalDateTime createdAt
) {
    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.isMustChangePassword(),
                user.getCreatedAt()
        );
    }
}
