package com.embobinados.apugen_backend.service;

import com.embobinados.apugen_backend.dto.ProcessResponseDTO;
import com.embobinados.apugen_backend.dto.ServiceResponseDTO;
import com.embobinados.apugen_backend.entity.*;
import com.embobinados.apugen_backend.entity.Process;
import com.embobinados.apugen_backend.repository.*;
import com.embobinados.apugen_backend.utilz.StringUtilz;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApuService {
    private final ProcessRepository processRepository;
    private final ProcessServiceRepository processServiceRepository;
    private final CompanyRepository companyRepository;
    private final MaterialRepository materialRepository;
    private final EquipmentRepository equipmentRepository;
    private final LaborRepository laborRepository;
    private final ServiceMaterialRepository serviceMaterialRepository;
    private final ServiceEquipmentRepository serviceEquipmentRepository;
    private final ServiceLaborRepository serviceLaborRepository;

    // ==========================================
    // GESTIÓN DE PROCESOS (OBRAS)
    // ==========================================

    @Transactional
    public Process createProcess(Process process) {
        if (process.getServiceRequest() == null || process.getServiceRequest().isBlank()) {
            throw new RuntimeException("El ID de la solicitud de servicio (obra) es obligatorio.");
        }
        String cleanId = process.getServiceRequest().trim();
        if (processRepository.existsById(cleanId)) {
            throw new RuntimeException("Ya existe un proceso registrado con la solicitud: " + cleanId);
        }
        process.setServiceRequest(cleanId);

        if (process.getCompany() == null || process.getCompany().getId() == null) {
            throw new RuntimeException("La empresa del proceso es obligatoria.");
        }
        Company company = companyRepository.findById(process.getCompany().getId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + process.getCompany().getId()));
        process.setCompany(company);

        return processRepository.save(process);
    }

    public List<Process> getAllProcesses() {
        List<Process> processes = processRepository.findAll();
        processes.forEach(p -> sortServicesBySequence(p.getServices(), p.getServiceRequest()));
        return processes;
    }

    public ProcessResponseDTO getProcessByServiceRequest(String serviceRequest) {
        Process process = processRepository.findById(serviceRequest)
                .orElseThrow(() -> new RuntimeException("No se encontró ningún proceso con la solicitud: " + serviceRequest));

        List<ProcessService> services = processServiceRepository.findByProcessServiceRequest(serviceRequest);
        sortServicesBySequence(services, serviceRequest);

        BigDecimal totalCalculatedPrice = services.stream()
                .map(s -> s.getCalculatedUnitPrice() != null ? s.getCalculatedUnitPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalProposedPrice = services.stream()
                .mapToLong(s -> s.getProposedUnitPrice() != null ? s.getProposedUnitPrice().longValue() : 0L)
                .sum();

        return new ProcessResponseDTO(
                process,
                services,
                services.size(),
                totalCalculatedPrice,
                totalProposedPrice
        );
    }

    public List<Process> searchProcesses(
            String companyId,
            String companyName,
            String mainProcess,
            String description,
            String power,
            String serial,
            String brand,
            String location,
            boolean exactMatch
    ) {
        companyId = StringUtilz.prepararFiltro(companyId, exactMatch);
        companyName = StringUtilz.prepararFiltro(companyName, exactMatch);
        mainProcess = StringUtilz.prepararFiltro(mainProcess, exactMatch);
        description = StringUtilz.prepararFiltro(description, exactMatch);
        power = StringUtilz.prepararFiltro(power, exactMatch);
        serial = StringUtilz.prepararFiltro(serial, exactMatch);
        brand = StringUtilz.prepararFiltro(brand, exactMatch);
        location = StringUtilz.prepararFiltro(location, exactMatch);

        List<Process> results = processRepository.searchApus(
                companyId, companyName, mainProcess, description, power, serial, brand, location
        );
        results.forEach(p -> sortServicesBySequence(p.getServices(), p.getServiceRequest()));
        return results;
    }

    @Transactional
    public Process updateProcess(String serviceRequest, Process updatedData) {
        Process existing = processRepository.findById(serviceRequest)
                .orElseThrow(() -> new RuntimeException("No se encontró el proceso con la solicitud: " + serviceRequest));

        if (updatedData.getCompany() == null || updatedData.getCompany().getId() == null) {
            throw new RuntimeException("La empresa del proceso es obligatoria.");
        }
        Company company = companyRepository.findById(updatedData.getCompany().getId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + updatedData.getCompany().getId()));

        existing.setCompany(company);
        existing.setMainProcess(updatedData.getMainProcess());
        existing.setPower(updatedData.getPower());
        existing.setSerial(updatedData.getSerial());
        existing.setBrand(updatedData.getBrand());
        existing.setLocation(updatedData.getLocation());

        return processRepository.save(existing);
    }

    @Transactional
    public void deleteProcess(String serviceRequest) {
        if (!processRepository.existsById(serviceRequest)) {
            throw new RuntimeException("No se puede eliminar: No se encontró ningún proceso con la solicitud " + serviceRequest);
        }
        processRepository.deleteById(serviceRequest);
    }

    // ==========================================
    // GESTIÓN DE SERVICIOS (APUs INDIVIDUALES)
    // ==========================================

    @Transactional
    public ProcessService createService(
            String processServiceRequest,
            ProcessService service,
            List<ServiceMaterial> materials,
            List<ServiceEquipment> equipments,
            List<ServiceLabor> labors
    ) {
        Process parentProcess = processRepository.findById(processServiceRequest)
                .orElseThrow(() -> new RuntimeException("No se encontró el proceso padre con la solicitud: " + processServiceRequest));

        List<ServiceMaterial> safeMaterials = materials != null ? materials : Collections.emptyList();
        List<ServiceEquipment> safeEquipments = equipments != null ? equipments : Collections.emptyList();
        List<ServiceLabor> safeLabors = labors != null ? labors : Collections.emptyList();

        service.setId(generateNextServiceId(processServiceRequest));
        service.setProcess(parentProcess);

        recalcularTotales(service, safeMaterials, safeEquipments, safeLabors);

        service.setMaterials(safeMaterials);
        service.setEquipments(safeEquipments);
        service.setLabors(safeLabors);

        return processServiceRepository.save(service);
    }

    public List<ProcessService> getServicesByProcess(String processServiceRequest) {
        if (!processRepository.existsById(processServiceRequest)) {
            throw new RuntimeException("No se encontró ningún proceso con la solicitud: " + processServiceRequest);
        }
        List<ProcessService> services = processServiceRepository.findByProcessServiceRequest(processServiceRequest);
        sortServicesBySequence(services, processServiceRequest);
        return services;
    }

    public ServiceResponseDTO getServiceById(String serviceId) {
        ProcessService service = processServiceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("No se encontró ningún servicio con el ID: " + serviceId));

        List<ServiceMaterial> materials = serviceMaterialRepository.findByServiceId(serviceId);
        List<ServiceEquipment> equipments = serviceEquipmentRepository.findByServiceId(serviceId);
        List<ServiceLabor> labors = serviceLaborRepository.findByServiceId(serviceId);

        BigDecimal totalMaterials = materials.stream()
                .map(ServiceMaterial::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEquipmentsDaily = equipments.stream()
                .map(ServiceEquipment::getDailyUseCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLaborsBase = labors.stream()
                .map(ServiceLabor::getDailyCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal socialLawsCost = totalLaborsBase
                .multiply(service.getSocialLawsPercentage())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalLaborsDaily = totalLaborsBase.add(socialLawsCost);

        return new ServiceResponseDTO(
                service.getProcess(),
                service,
                materials,
                equipments,
                labors,
                totalMaterials,
                totalEquipmentsDaily,
                totalLaborsBase,
                socialLawsCost,
                totalLaborsDaily
        );
    }

    @Transactional
    public ProcessService updateService(
            String serviceId,
            ProcessService updatedData,
            List<ServiceMaterial> newMaterials,
            List<ServiceEquipment> newEquipments,
            List<ServiceLabor> newLabors
    ) {
        ProcessService existing = processServiceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("No se encontró el servicio con el ID: " + serviceId));

        List<ServiceMaterial> safeMaterials = newMaterials != null ? newMaterials : Collections.emptyList();
        List<ServiceEquipment> safeEquipments = newEquipments != null ? newEquipments : Collections.emptyList();
        List<ServiceLabor> safeLabors = newLabors != null ? newLabors : Collections.emptyList();

        existing.setDescription(updatedData.getDescription());
        existing.setItemQuantity(updatedData.getItemQuantity());
        existing.setPerformance(updatedData.getPerformance());
        existing.setSocialLawsPercentage(updatedData.getSocialLawsPercentage());
        existing.setAdminPercentage(updatedData.getAdminPercentage());
        existing.setUtilityContingencyPercentage(updatedData.getUtilityContingencyPercentage());

        existing.getMaterials().clear();
        existing.getEquipments().clear();
        existing.getLabors().clear();

        recalcularTotales(existing, safeMaterials, safeEquipments, safeLabors);
        existing.getMaterials().addAll(safeMaterials);
        existing.getEquipments().addAll(safeEquipments);
        existing.getLabors().addAll(safeLabors);

        return processServiceRepository.save(existing);
    }

    @Transactional
    public void deleteService(String serviceId) {
        ProcessService existing = processServiceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("No se puede eliminar: No se encontró ningún servicio con el ID " + serviceId));

        Process parent = existing.getProcess();
        if (parent != null && parent.getServices() != null) {
            parent.getServices().remove(existing);
        }
        processServiceRepository.delete(existing);
    }

    // ==========================================
    // MOTOR DE CÁLCULO Y UTILIDADES DE SECUENCIA
    // ==========================================

    private String generateNextServiceId(String processServiceRequest) {
        List<ProcessService> existingServices = processServiceRepository.findByProcessServiceRequest(processServiceRequest);
        String prefix = processServiceRequest + "-";
        int maxSuffix = -1;

        for (ProcessService s : existingServices) {
            int suffix = extractSequenceNumber(s.getId(), prefix);
            if (suffix > maxSuffix) {
                maxSuffix = suffix;
            }
        }

        return prefix + (maxSuffix + 1);
    }

    private void sortServicesBySequence(List<ProcessService> services, String processServiceRequest) {
        if (services == null || services.isEmpty()) return;
        String prefix = processServiceRequest + "-";
        services.sort(Comparator.comparingInt(s -> extractSequenceNumber(s.getId(), prefix)));
    }

    private int extractSequenceNumber(String serviceId, String prefix) {
        if (serviceId == null || !serviceId.startsWith(prefix)) {
            return Integer.MAX_VALUE;
        }
        try {
            return Integer.parseInt(serviceId.substring(prefix.length()));
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    private void recalcularTotales(
            ProcessService service,
            List<ServiceMaterial> materials,
            List<ServiceEquipment> equipments,
            List<ServiceLabor> labors
    ) {
        if (service.getPerformance() == null || service.getPerformance().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El rendimiento del servicio debe ser mayor a cero para poder calcular los costos.");
        }

        // CALCULO DE MATERIALES
        BigDecimal totalMateriales = BigDecimal.ZERO;
        for (ServiceMaterial sm : materials) {
            Material catMat = materialRepository.findById(sm.getMaterial().getId())
                    .orElseThrow(() -> new RuntimeException("Material no encontrado: " + sm.getMaterial().getId()));

            sm.setDescriptionSnapshot(catMat.getDescription());
            sm.setUnitSnapshot(catMat.getUnit());
            sm.setCostApplied(catMat.getBaseCost());

            BigDecimal amount = sm.getCostApplied().multiply(sm.getQuantity()).setScale(2, RoundingMode.HALF_UP);
            sm.setAmount(amount);
            sm.setService(service);

            totalMateriales = totalMateriales.add(amount);
        }

        BigDecimal materialUnitCost = totalMateriales.multiply(service.getItemQuantity()).setScale(2, RoundingMode.HALF_UP);
        service.setMaterialUnitCost(materialUnitCost);

        // CALCULO DE EQUIPOS
        BigDecimal totalEquipos = BigDecimal.ZERO;
        for (ServiceEquipment se : equipments) {
            Equipment catEq = equipmentRepository.findById(se.getEquipment().getId())
                    .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + se.getEquipment().getId()));

            se.setDescriptionSnapshot(catEq.getDescription());
            se.setValueApplied(catEq.getBaseValue());
            se.setDepreciationFactorApplied(catEq.getDepreciationFactor());

            BigDecimal dailyUseCost = se.getValueApplied().multiply(se.getDepreciationFactorApplied().setScale(6, RoundingMode.HALF_UP));
            se.setDailyUseCost(dailyUseCost);
            se.setService(service);

            totalEquipos = totalEquipos.add(dailyUseCost);
        }

        BigDecimal equipmentUnitCost = totalEquipos.divide(service.getPerformance(), 2, RoundingMode.HALF_UP);
        service.setEquipmentUnitCost(equipmentUnitCost);

        // CALCULO DE MANO DE OBRA
        BigDecimal totalEnMano = BigDecimal.ZERO;
        for (ServiceLabor sl : labors) {
            Labor catLab = laborRepository.findById(sl.getLabor().getId())
                    .orElseThrow(() -> new RuntimeException("Mano de Obra no encontrada: " + sl.getLabor().getId()));

            sl.setDescriptionSnapshot(catLab.getDescription());
            sl.setDailyWageApplied(catLab.getBaseDailyWage());

            BigDecimal dailyCost = sl.getDailyWageApplied().multiply(sl.getDotation()).setScale(2, RoundingMode.HALF_UP);
            sl.setDailyCost(dailyCost);
            sl.setService(service);

            totalEnMano = totalEnMano.add(dailyCost);
        }

        BigDecimal costoLeyesSociales = totalEnMano.multiply(service.getSocialLawsPercentage());
        BigDecimal costoDiarioPersonal = totalEnMano.add(costoLeyesSociales);

        BigDecimal laborUnitCost = costoDiarioPersonal.divide(service.getPerformance(), 2, RoundingMode.HALF_UP);
        service.setLaborUnitCost(laborUnitCost);

        // TOTALES GENERALES DEL SERVICIO
        BigDecimal directUnitCost = materialUnitCost.add(equipmentUnitCost).add(laborUnitCost);
        service.setDirectUnitCost(directUnitCost);

        BigDecimal adminCostValue = directUnitCost.multiply(service.getAdminPercentage()).setScale(2, RoundingMode.HALF_UP);
        service.setAdminCostValue(adminCostValue);

        BigDecimal totalUnitCost = directUnitCost.add(adminCostValue);
        service.setTotalUnitCost(totalUnitCost);

        BigDecimal utilityCostValue = totalUnitCost.multiply(service.getUtilityContingencyPercentage()).setScale(2, RoundingMode.HALF_UP);
        service.setUtilityCostValue(utilityCostValue);

        BigDecimal calculatedUnitPrice = totalUnitCost.add(utilityCostValue);
        service.setCalculatedUnitPrice(calculatedUnitPrice);

        service.setProposedUnitPrice(calculatedUnitPrice.setScale(0, RoundingMode.HALF_UP).intValue());
    }
}
