package com.embobinados.apugen_backend.service;

import com.embobinados.apugen_backend.dto.ApuResponseDTO;
import com.embobinados.apugen_backend.entity.*;
import com.embobinados.apugen_backend.entity.Process;
import com.embobinados.apugen_backend.repository.*;
import com.embobinados.apugen_backend.utilz.StringUtilz;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApuService {
    private final ProcessRepository processRepository;
    private final MaterialRepository materialRepository;
    private final EquipmentRepository equipmentRepository;
    private final LaborRepository laborRepository;
    private final ProcessMaterialRepository processMaterialRepository;
    private final ProcessEquipmentRepository processEquipmentRepository;
    private final ProcessLaborRepository processLaborRepository;

    @Transactional
    public Process calcAndSaveApu(
            Process process,
            List<ProcessMaterial> materials,
            List<ProcessEquipment> equipments,
            List<ProcessLabor> labors
    ) {
        recalcularTotales(process, materials, equipments, labors);

        // Inyectamos las listas dentro del proceso para completar la relación bidireccional
        process.setMaterials(materials);
        process.setEquipments(equipments);
        process.setLabors(labors);

        // Al guardar la cabecera, Hibernate detecta las listas internas y guarda todo en cascada
        return processRepository.save(process);
    }

    private void recalcularTotales(
            Process process,
            List<ProcessMaterial> materials,
            List<ProcessEquipment> equipments,
            List<ProcessLabor> labors
    ) {
        if (process.getPerformance() == null || process.getPerformance().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El rendimiento del APU debe ser mayor a cero para poder calcular los costos.");
        }

        // CALCULO DE MATERIALES
        BigDecimal totalMateriales = BigDecimal.ZERO;
        for (ProcessMaterial pm : materials) {
            Material catMat = materialRepository.findById(pm.getMaterial().getId())
                    .orElseThrow(() -> new RuntimeException("Material no encontrado: " + pm.getMaterial().getId()));

            pm.setDescriptionSnapshot(catMat.getDescription());
            pm.setUnitSnapshot(catMat.getUnit());
            pm.setCostApplied(catMat.getBaseCost());

            BigDecimal amount = pm.getCostApplied().multiply(pm.getQuantity()).setScale(2, RoundingMode.HALF_UP);
            pm.setAmount(amount);
            pm.setProcess(process);

            totalMateriales = totalMateriales.add(amount);
        }

        BigDecimal materialUnitCost = totalMateriales.multiply(process.getItemQuantity()).setScale(2, RoundingMode.HALF_UP);
        process.setMaterialUnitCost(materialUnitCost);

        // CALCULO DE EQUIPOS
        BigDecimal totalEquipos = BigDecimal.ZERO;
        for (ProcessEquipment pe : equipments) {
            Equipment catEq = equipmentRepository.findById(pe.getEquipment().getId())
                    .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + pe.getEquipment().getId()));

            pe.setDescriptionSnapshot(catEq.getDescription());
            pe.setValueApplied(catEq.getBaseValue());
            pe.setDepreciationFactorApplied(catEq.getDepreciationFactor());

            BigDecimal dailyUseCost = pe.getValueApplied().multiply(pe.getDepreciationFactorApplied().setScale(6, RoundingMode.HALF_UP));
            pe.setDailyUseCost(dailyUseCost);
            pe.setProcess(process);

            totalEquipos = totalEquipos.add(dailyUseCost);
        }

        BigDecimal equipmentUnitCost = totalEquipos.divide(process.getPerformance(), 2, RoundingMode.HALF_UP);
        process.setEquipmentUnitCost(equipmentUnitCost);

        // CALCULO DE MANO DE OBRA
        BigDecimal totalEnMano = BigDecimal.ZERO;
        for (ProcessLabor pl : labors) {
            Labor catLab = laborRepository.findById(pl.getLabor().getId())
                    .orElseThrow(() -> new RuntimeException("Mano de Obra no encontrada: " + pl.getLabor().getId()));

            pl.setDescriptionSnapshot(catLab.getDescription());
            pl.setDailyWageApplied(catLab.getBaseDailyWage());

            BigDecimal dailyCost = pl.getDailyWageApplied().multiply(pl.getDotation()).setScale(2, RoundingMode.HALF_UP);
            pl.setDailyCost(dailyCost);
            pl.setProcess(process);

            totalEnMano = totalEnMano.add(dailyCost);
        }

        BigDecimal costoLeyesSociales = totalEnMano.multiply(process.getSocialLawsPercentage());
        BigDecimal costoDiarioPersonal = totalEnMano.add(costoLeyesSociales);

        BigDecimal laborUnitCost = costoDiarioPersonal.divide(process.getPerformance(), 2, RoundingMode.HALF_UP);
        process.setLaborUnitCost(laborUnitCost);

        // TOTALES GENERALES DEL PROCESO
        BigDecimal directUnitCost = materialUnitCost.add(equipmentUnitCost).add(laborUnitCost);
        process.setDirectUnitCost(directUnitCost);

        BigDecimal adminCostValue = directUnitCost.multiply(process.getAdminPercentage()).setScale(2, RoundingMode.HALF_UP);
        process.setAdminCostValue(adminCostValue);

        BigDecimal totalUnitCost = directUnitCost.add(adminCostValue);
        process.setTotalUnitCost(totalUnitCost);

        BigDecimal utilityCostValue = totalUnitCost.multiply(process.getUtilityContingencyPercentage()).setScale(2, RoundingMode.HALF_UP);
        process.setUtilityCostValue(utilityCostValue);

        BigDecimal calculatedUnitPrice = totalUnitCost.add(utilityCostValue);
        process.setCalculatedUnitPrice(calculatedUnitPrice);

        process.setProposedUnitPrice(calculatedUnitPrice.setScale(0, RoundingMode.HALF_UP).intValue());
    }

    @Transactional
    public void deleteApu(String serviceRequest) {
        if (!processRepository.existsById(serviceRequest)) {
            throw new RuntimeException("No se puede eliminar: No se encontró ningún APU con la solicitud " + serviceRequest);
        }

        // Al eliminar el padre, la base de datos elimina los detalles automáticamente
        processRepository.deleteById(serviceRequest);
    }

    public ApuResponseDTO getApuByServiceRequest(String serviceRequest) {
        // 1. Buscar la cabecera principal
        Process process = processRepository.findById(serviceRequest)
                .orElseThrow(() -> new RuntimeException("No se encontró ningún APU con la solicitud: " + serviceRequest));

        // 2. Buscar las 3 listas
        List<ProcessMaterial> materials = processMaterialRepository.findByProcessServiceRequest(serviceRequest);
        List<ProcessEquipment> equipments = processEquipmentRepository.findByProcessServiceRequest(serviceRequest);
        List<ProcessLabor> labors = processLaborRepository.findByProcessServiceRequest(serviceRequest);

        // 3. Calcular subtotales intermedios con BigDecimal
        BigDecimal totalMaterials = materials.stream()
                .map(ProcessMaterial::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEquipmentsDaily = equipments.stream()
                .map(ProcessEquipment::getDailyUseCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLaborsBase = labors.stream()
                .map(ProcessLabor::getDailyCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal socialLawsCost = totalLaborsBase
                .multiply(process.getSocialLawsPercentage())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalLaborsDaily = totalLaborsBase.add(socialLawsCost);

        // 4. Empaquetar y devolver
        return new ApuResponseDTO(
                process, materials, equipments, labors,
                totalMaterials, totalEquipmentsDaily, totalLaborsBase, socialLawsCost, totalLaborsDaily
        );
    }

    public List<Process> getAllApus() {
        // findAll() busca todas las cabeceras de la tabla 'processes'
        return processRepository.findAll();
    }

    public List<Process> searchApus(String companyId, String companyName, String mainProcess, String description, String power, String serial, String brand, String location, boolean exactMatch) {

        // Limpiamos strings vacíos para evitar falsos positivos en el IS NULL
        companyId = StringUtilz.prepararFiltro(companyId, exactMatch);
        companyName = StringUtilz.prepararFiltro(companyName, exactMatch);
        mainProcess = StringUtilz.prepararFiltro(mainProcess, exactMatch);
        description = StringUtilz.prepararFiltro(description, exactMatch);
        power = StringUtilz.prepararFiltro(power, exactMatch);
        serial = StringUtilz.prepararFiltro(serial, exactMatch);
        brand = StringUtilz.prepararFiltro(brand, exactMatch);
        location = StringUtilz.prepararFiltro(location, exactMatch);

        // Si no consigue nada, Spring Data JPA devuelve [] automáticamente.
        return processRepository.searchApus(companyId, companyName, mainProcess, description, power, serial, brand, location);
    }

    @Transactional
    public Process updateApu(
            String serviceRequest,
            Process updatedData,
            List<ProcessMaterial> newMaterials,
            List<ProcessEquipment> newEquipments,
            List<ProcessLabor> newLabors
    ) {
        Process existing = processRepository.findById(serviceRequest)
                .orElseThrow(() -> new RuntimeException("No se encontró el APU con la solicitud: " + serviceRequest));

        // 1. Actualizar cabecera y variables
        existing.setCompany(updatedData.getCompany());
        existing.setMainProcess(updatedData.getMainProcess());
        existing.setDescription(updatedData.getDescription());
        existing.setPower(updatedData.getPower());
        existing.setSerial(updatedData.getSerial());
        existing.setBrand(updatedData.getBrand());
        existing.setLocation(updatedData.getLocation());
        existing.setItemQuantity(updatedData.getItemQuantity());
        existing.setPerformance(updatedData.getPerformance());
        existing.setSocialLawsPercentage(updatedData.getSocialLawsPercentage());
        existing.setAdminPercentage(updatedData.getAdminPercentage());
        existing.setUtilityContingencyPercentage(updatedData.getUtilityContingencyPercentage());

        // 2. Limpiar listas anteriores (orphanRemoval eliminará los registros viejos)
        existing.getMaterials().clear();
        existing.getEquipments().clear();
        existing.getLabors().clear();

        // 3. Recalcular todo y reasignar listas
        recalcularTotales(existing, newMaterials, newEquipments, newLabors);
        existing.getMaterials().addAll(newMaterials);
        existing.getEquipments().addAll(newEquipments);
        existing.getLabors().addAll(newLabors);

        return processRepository.save(existing);
    }
}
