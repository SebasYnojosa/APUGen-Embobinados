package com.embobinados.apugen_backend.dto;

public record ChangePasswordRequestDTO(
        String currentPassword,
        String newPassword
) {}
