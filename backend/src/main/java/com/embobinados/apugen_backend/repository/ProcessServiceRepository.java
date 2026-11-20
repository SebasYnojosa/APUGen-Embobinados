package com.embobinados.apugen_backend.repository;

import com.embobinados.apugen_backend.entity.ProcessService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessServiceRepository extends JpaRepository<ProcessService, String> {
    List<ProcessService> findByProcessServiceRequest(String serviceRequest);
}
