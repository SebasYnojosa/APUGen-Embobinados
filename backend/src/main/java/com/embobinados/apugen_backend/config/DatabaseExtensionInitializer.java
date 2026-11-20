package com.embobinados.apugen_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseExtensionInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS unaccent");
            log.info("Extensión PostgreSQL 'unaccent' verificada/habilitada correctamente.");
        } catch (Exception ex) {
            log.warn("No se pudo habilitar automáticamente la extensión 'unaccent': {}", ex.getMessage());
        }
    }
}
