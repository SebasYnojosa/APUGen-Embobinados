package com.embobinados.apugen_backend.repository;

import com.embobinados.apugen_backend.entity.CatalogCodification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogCodificationRepository extends JpaRepository<CatalogCodification, String> {
    Optional<CatalogCodification> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
    List<CatalogCodification> findByTypeOrderByCodeAsc(String type);
    List<CatalogCodification> findAllByOrderByTypeAscCodeAsc();
}
