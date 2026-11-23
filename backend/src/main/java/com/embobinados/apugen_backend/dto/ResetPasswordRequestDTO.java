package com.embobinados.apugen_backend.dto;

public record ResetPasswordRequestDTO(
        String newPassword,
        Boolean mustChangePassword
) {}
