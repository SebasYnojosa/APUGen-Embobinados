package com.embobinados.apugen_backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ServiceRequestDTO {
    private String description;

    // Variables de cálculo del servicio
    private BigDecimal itemQuantity;
    private BigDecimal performance;
    private BigDecimal socialLawsPercentage;
    private BigDecimal adminPercentage;
    private BigDecimal utilityContingencyPercentage;

    // Listas de recursos del servicio
    private List<MaterialDTO> materials = new ArrayList<>();
    private List<EquipmentDTO> equipments = new ArrayList<>();
    private List<LaborDTO> labors = new ArrayList<>();

    @Data
    public static class MaterialDTO {
        private String materialId;
        private BigDecimal quantity;
    }

    @Data
    public static class EquipmentDTO {
        private String equipmentId;
        private BigDecimal quantity;
    }

    @Data
    public static class LaborDTO {
        private String laborId;
        private BigDecimal dotation;
    }
}
