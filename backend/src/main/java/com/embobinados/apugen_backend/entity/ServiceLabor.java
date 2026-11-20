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
@Table(name = "service_labors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceLabor {
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
    @JoinColumn(name = "labor_id", nullable = false)
    private Labor labor;

    // Fotografía (Snapshot)
    @Column(nullable = false, length = 255)
    private String descriptionSnapshot;

    @Column(name = "daily_wage_applied", precision = 12, scale = 2, nullable = false)
    private BigDecimal dailyWageApplied;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal dotation; // Porcentaje (Ej: 1.00 para 100%)

    @Column(name = "daily_cost", precision = 12, scale = 2, nullable = false)
    private BigDecimal dailyCost; // dailyWageApplied * dotation
}
