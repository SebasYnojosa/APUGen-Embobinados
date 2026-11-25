package com.embobinados.apugen_backend.config;

import com.embobinados.apugen_backend.entity.Brand;
import com.embobinados.apugen_backend.repository.BrandRepository;
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
public class BrandInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final BrandRepository brandRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<String> existingProcessBrands = jdbcTemplate.queryForList(
                "SELECT DISTINCT TRIM(brand) FROM processes WHERE brand IS NOT NULL AND TRIM(brand) <> ''",
                String.class
        );

        int createdCount = 0;
        for (String brandName : existingProcessBrands) {
            if (brandName == null || brandName.isBlank()) continue;
            String cleanName = brandName.trim();
            if (!brandRepository.existsByNameIgnoreCase(cleanName)) {
                Brand brand = new Brand();
                brand.setName(cleanName);
                brandRepository.save(brand);
                createdCount++;
            }
        }

        if (createdCount > 0) {
            log.info("Se sincronizaron {} marcas existentes desde las obras registradas.", createdCount);
        }
    }
}
