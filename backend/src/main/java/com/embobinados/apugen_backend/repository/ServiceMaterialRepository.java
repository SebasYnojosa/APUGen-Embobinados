package com.embobinados.apugen_backend.repository;

import com.embobinados.apugen_backend.entity.ServiceMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceMaterialRepository extends JpaRepository<ServiceMaterial, String> {
    List<ServiceMaterial> findByServiceId(String serviceId);
}
