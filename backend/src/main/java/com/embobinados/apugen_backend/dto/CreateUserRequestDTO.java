package com.embobinados.apugen_backend.dto;

public record CreateUserRequestDTO(
        String username,
        String fullName,
        String password,
        String role,
        Boolean mustChangePassword
) {}
