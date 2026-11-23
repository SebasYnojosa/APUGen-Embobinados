package com.embobinados.apugen_backend.controllers;

import com.embobinados.apugen_backend.dto.ChangePasswordRequestDTO;
import com.embobinados.apugen_backend.dto.LoginRequestDTO;
import com.embobinados.apugen_backend.dto.LoginResponseDTO;
import com.embobinados.apugen_backend.dto.UserResponseDTO;
import com.embobinados.apugen_backend.entity.User;
import com.embobinados.apugen_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(authService.getCurrentUser(currentUser.getUsername()));
    }

    @PutMapping("/cambiar-password")
    public ResponseEntity<UserResponseDTO> cambiarPassword(
            @AuthenticationPrincipal User currentUser,
            @RequestBody ChangePasswordRequestDTO dto
    ) {
        return ResponseEntity.ok(authService.changeOwnPassword(currentUser.getUsername(), dto));
    }
}
