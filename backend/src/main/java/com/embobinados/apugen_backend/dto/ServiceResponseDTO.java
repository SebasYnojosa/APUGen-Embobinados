package com.embobinados.apugen_backend.dto;

import com.embobinados.apugen_backend.entity.Process;
import com.embobinados.apugen_backend.entity.ProcessService;
import com.embobinados.apugen_backend.entity.ServiceEquipment;
import com.embobinados.apugen_backend.entity.ServiceLabor;
import com.embobinados.apugen_backend.entity.ServiceMaterial;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class ServiceResponseDTO {
    private Process process;
    private ProcessService service;
    private List<ServiceMaterial> materials;
    private List<ServiceEquipment> equipments;
    private List<ServiceLabor> labors;

    // Subtotales calculados para la vista detallada del servicio
    private BigDecimal totalMaterials;
    private BigDecimal totalEquipmentsDaily;
    private BigDecimal totalLaborsBase;
    private BigDecimal socialLawsCost;
    private BigDecimal totalLaborsDaily;
}
