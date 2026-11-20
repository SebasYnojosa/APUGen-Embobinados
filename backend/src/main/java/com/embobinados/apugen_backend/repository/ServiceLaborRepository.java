package com.embobinados.apugen_backend.repository;

import com.embobinados.apugen_backend.entity.ServiceLabor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceLaborRepository extends JpaRepository<ServiceLabor, String> {
    List<ServiceLabor> findByServiceId(String serviceId);
}
