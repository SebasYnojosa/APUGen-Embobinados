package com.embobinados.apugen_backend.entity;

import com.embobinados.apugen_backend.utilz.MotorTypeUtil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "labors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Labor {
    @Id
    private String id; // ID Manual

    @Column(nullable = false, length = 255)
    private String description; // Ej: "Técnico Embobinador Principal"

    @Column(name = "base_daily_wage", precision = 12, scale = 2, nullable = false)
    private BigDecimal baseDailyWage;

    @Column(name = "para_tipo_m", length = 50)
    private String paraTipoM = MotorTypeUtil.ALL_MOTOR_TYPES;

    @PrePersist
    @PreUpdate
    private void ensureParaTipoM() {
        this.paraTipoM = MotorTypeUtil.normalizeParaTipoM(this.paraTipoM);
    }
}