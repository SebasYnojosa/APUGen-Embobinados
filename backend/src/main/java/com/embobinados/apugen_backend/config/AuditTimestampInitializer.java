package com.embobinados.apugen_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditTimestampInitializer implements ApplicationRunner {

    private static final List<String> AUDITABLE_TABLES = List.of(
            "processes",
            "process_services",
            "companies",
            "materials",
            "equipments",
            "labors",
            "catalog_codifications",
            "brands"
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        int totalUpdated = 0;
        for (String table : AUDITABLE_TABLES) {
            int updated = jdbcTemplate.update(
                    "UPDATE " + table
                            + " SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),"
                            + " updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)"
                            + " WHERE created_at IS NULL OR updated_at IS NULL"
            );
            totalUpdated += updated;
        }
        if (totalUpdated > 0) {
            log.info("Fechas de creación/actualización inicializadas en {} registros existentes.", totalUpdated);
        }
    }
}
