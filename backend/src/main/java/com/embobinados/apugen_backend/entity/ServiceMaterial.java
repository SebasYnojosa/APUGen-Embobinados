package com.embobinados.apugen_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "service_materials")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ProcessService service;

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    // Fotografía (Snapshot) de los datos al momento de crear el servicio
    @Column(nullable = false, length = 255)
    private String descriptionSnapshot;

    @Column(length = 20)
    private String unitSnapshot;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal costApplied;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal amount; // quantity * costApplied
}
