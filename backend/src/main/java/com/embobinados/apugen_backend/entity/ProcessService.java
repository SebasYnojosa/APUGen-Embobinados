package com.embobinados.apugen_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "process_services")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class ProcessService extends AuditableEntity {
    @Id
    @Column(length = 40)
    private String id; // Ej: SR-2026-001-0, SR-2026-001-1

    @ManyToOne
    @JoinColumn(name = "process_service_request", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Process process;

    @Column(nullable = false, length = 255)
    private String description; // Nombre / descripción del servicio

    // --- VARIABLES DEL APU ---
    @Column(name = "item_quantity", precision = 12, scale = 2)
    private BigDecimal itemQuantity;

    @Column(precision = 12, scale = 4)
    private BigDecimal performance;

    @Column(name = "social_laws_percentage", precision = 5, scale = 4)
    private BigDecimal socialLawsPercentage;

    @Column(name = "admin_percentage", precision = 5, scale = 4)
    private BigDecimal adminPercentage;

    @Column(name = "utility_contingency_percentage", precision = 5, scale = 4)
    private BigDecimal utilityContingencyPercentage;

    // --- TOTALES CALCULADOS (Se guardan para congelar el presupuesto) ---
    @Column(name = "material_unit_cost", precision = 12, scale = 2)
    private BigDecimal materialUnitCost;

    @Column(name = "equipment_unit_cost", precision = 12, scale = 2)
    private BigDecimal equipmentUnitCost;

    @Column(name = "labor_unit_cost", precision = 12, scale = 2)
    private BigDecimal laborUnitCost;

    @Column(name = "direct_unit_cost", precision = 14, scale = 2)
    private BigDecimal directUnitCost;

    @Column(name = "admin_cost_value", precision = 14, scale = 2)
    private BigDecimal adminCostValue;

    @Column(name = "total_unit_cost", precision = 14, scale = 2)
    private BigDecimal totalUnitCost;

    @Column(name = "utility_cost_value", precision = 14, scale = 2)
    private BigDecimal utilityCostValue;

    @Column(name = "calculated_unit_price", precision = 14, scale = 2)
    private BigDecimal calculatedUnitPrice;

    @Column(name = "proposed_unit_price")
    private Integer proposedUnitPrice;

    // --- RELACIONES EN CASCADA HACIA DETALLES (SNAPSHOTS) ---
    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ServiceMaterial> materials = new ArrayList<>();

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ServiceEquipment> equipments = new ArrayList<>();

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ServiceLabor> labors = new ArrayList<>();
}
