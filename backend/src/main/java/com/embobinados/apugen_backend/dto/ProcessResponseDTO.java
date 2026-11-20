package com.embobinados.apugen_backend.dto;

import com.embobinados.apugen_backend.entity.Process;
import com.embobinados.apugen_backend.entity.ProcessService;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class ProcessResponseDTO {
    private Process process;
    private List<ProcessService> services;
    private int servicesCount;
    private BigDecimal totalCalculatedPrice;
    private long totalProposedPrice;
}
