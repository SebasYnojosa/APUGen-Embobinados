package com.embobinados.apugen_backend.config;

import com.embobinados.apugen_backend.utilz.MotorTypeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogMotorTypeInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        int updatedMaterials = jdbcTemplate.update(
                "UPDATE materials SET para_tipo_m = ? WHERE para_tipo_m IS NULL OR TRIM(para_tipo_m) = ''",
                MotorTypeUtil.ALL_MOTOR_TYPES
        );
        int updatedEquipments = jdbcTemplate.update(
                "UPDATE equipments SET para_tipo_m = ? WHERE para_tipo_m IS NULL OR TRIM(para_tipo_m) = ''",
                MotorTypeUtil.ALL_MOTOR_TYPES
        );
        int updatedLabors = jdbcTemplate.update(
                "UPDATE labors SET para_tipo_m = ? WHERE para_tipo_m IS NULL OR TRIM(para_tipo_m) = ''",
                MotorTypeUtil.ALL_MOTOR_TYPES
        );

        int totalUpdated = updatedMaterials + updatedEquipments + updatedLabors;
        if (totalUpdated > 0) {
            log.info(
                    "para_tipo_m inicializado a todos los motores en {} registros existentes (materiales={}, equipos={}, cargos={}).",
                    totalUpdated, updatedMaterials, updatedEquipments, updatedLabors
            );
        }
    }
}
