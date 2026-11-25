package com.embobinados.apugen_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "companies")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class Company extends AuditableEntity {
    @Id
    private String id; // ID Manual

    @Column(nullable = false, length = 255)
    private String name;
}