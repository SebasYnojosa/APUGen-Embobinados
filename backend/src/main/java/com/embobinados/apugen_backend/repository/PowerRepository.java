package com.embobinados.apugen_backend.repository;

import com.embobinados.apugen_backend.entity.Power;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PowerRepository extends JpaRepository<Power, String> {
    Optional<Power> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Power> findAllByOrderByNameAsc();
}
