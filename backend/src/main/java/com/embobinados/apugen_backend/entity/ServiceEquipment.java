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
@Table(name = "service_equipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEquipment {
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
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    // Fotografía (Snapshot)
    @Column(nullable = false, length = 255)
    private String descriptionSnapshot;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal valueApplied;

    @Column(name = "depreciation_factor_applied", precision = 12, scale = 5, nullable = false)
    private BigDecimal depreciationFactorApplied;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "daily_use_cost", precision = 12, scale = 2, nullable = false)
    private BigDecimal dailyUseCost; // valueApplied * depreciationFactorApplied
}
