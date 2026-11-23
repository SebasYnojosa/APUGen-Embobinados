package com.embobinados.apugen_backend.dto;

public record LoginResponseDTO(
        String token,
        UserResponseDTO user
) {}
