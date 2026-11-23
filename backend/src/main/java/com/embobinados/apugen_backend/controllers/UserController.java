package com.embobinados.apugen_backend.controllers;

import com.embobinados.apugen_backend.dto.CreateUserRequestDTO;
import com.embobinados.apugen_backend.dto.ResetPasswordRequestDTO;
import com.embobinados.apugen_backend.dto.UpdateUserRequestDTO;
import com.embobinados.apugen_backend.dto.UserResponseDTO;
import com.embobinados.apugen_backend.dto.UserStatusRequestDTO;
import com.embobinados.apugen_backend.entity.User;
import com.embobinados.apugen_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> crearUsuario(@RequestBody CreateUserRequestDTO dto) {
        return ResponseEntity.ok(userService.createUser(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> actualizarUsuario(
            @PathVariable String id,
            @RequestBody UpdateUserRequestDTO dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.updateUser(id, dto, currentUser.getUsername()));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<UserResponseDTO> cambiarEstado(
            @PathVariable String id,
            @RequestBody UserStatusRequestDTO dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.updateUserStatus(id, dto.active(), currentUser.getUsername()));
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<UserResponseDTO> resetPassword(
            @PathVariable String id,
            @RequestBody ResetPasswordRequestDTO dto
    ) {
        return ResponseEntity.ok(userService.resetPassword(id, dto));
    }
}
