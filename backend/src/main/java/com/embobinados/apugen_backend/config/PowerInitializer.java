package com.embobinados.apugen_backend.config;

import com.embobinados.apugen_backend.entity.Power;
import com.embobinados.apugen_backend.repository.PowerRepository;
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
public class PowerInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PowerRepository powerRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<String> existingProcessPowers = jdbcTemplate.queryForList(
                "SELECT DISTINCT TRIM(power) FROM processes WHERE power IS NOT NULL AND TRIM(power) <> ''",
                String.class
        );

        int createdCount = 0;
        for (String powerName : existingProcessPowers) {
            if (powerName == null || powerName.isBlank()) continue;
            String cleanName = powerName.trim();
            if (!powerRepository.existsByNameIgnoreCase(cleanName)) {
                Power power = new Power();
                power.setName(cleanName);
                powerRepository.save(power);
                createdCount++;
            }
        }

        if (createdCount > 0) {
            log.info("Se sincronizaron {} potencias existentes desde las obras registradas.", createdCount);
        }
    }
}
