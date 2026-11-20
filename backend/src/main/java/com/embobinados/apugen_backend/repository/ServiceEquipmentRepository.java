package com.embobinados.apugen_backend.repository;

import com.embobinados.apugen_backend.entity.ServiceEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceEquipmentRepository extends JpaRepository<ServiceEquipment, String> {
    List<ServiceEquipment> findByServiceId(String serviceId);
}
