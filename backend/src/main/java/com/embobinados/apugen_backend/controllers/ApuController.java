package com.embobinados.apugen_backend.controllers;

import com.embobinados.apugen_backend.dto.ProcessRequestDTO;
import com.embobinados.apugen_backend.dto.ProcessResponseDTO;
import com.embobinados.apugen_backend.dto.ServiceRequestDTO;
import com.embobinados.apugen_backend.dto.ServiceResponseDTO;
import com.embobinados.apugen_backend.entity.*;
import com.embobinados.apugen_backend.entity.Process;
import com.embobinados.apugen_backend.service.ApuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/apus")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApuController {

    private final ApuService apuService;

    // ==========================================
    // ENDPOINTS DE PROCESOS (OBRAS)
    // ==========================================

    @PostMapping
    public ResponseEntity<Process> crearProceso(@RequestBody ProcessRequestDTO dto) {
        Process process = mapProcessDto(dto);
        process.setServiceRequest(dto.getServiceRequest());
        Process savedProcess = apuService.createProcess(process);
        return ResponseEntity.ok(savedProcess);
    }

    @GetMapping
    public ResponseEntity<List<Process>> listarTodosLosProcesos() {
        return ResponseEntity.ok(apuService.getAllProcesses());
    }

    @GetMapping("/porOrden")
    public ResponseEntity<ProcessResponseDTO> buscarProcesoPorOrdenServicio(
            @RequestParam("serviceRequest") String serviceRequest
    ) {
        return ResponseEntity.ok(apuService.getProcessByServiceRequest(serviceRequest));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Process>> buscarProcesos(
            @RequestParam(required = false) String companyId,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String mainProcess,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String power,
            @RequestParam(required = false) String serial,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "false") boolean exactMatch
    ) {
        List<Process> resultados = apuService.searchProcesses(
                companyId, companyName, mainProcess, description, power, serial, brand, location, exactMatch
        );
        return ResponseEntity.ok(resultados);
    }

    @PutMapping
    public ResponseEntity<Process> actualizarProceso(
            @RequestParam("serviceRequest") String serviceRequest,
            @RequestBody ProcessRequestDTO dto
    ) {
        Process processData = mapProcessDto(dto);
        return ResponseEntity.ok(apuService.updateProcess(serviceRequest, processData));
    }

    @DeleteMapping
    public ResponseEntity<Void> eliminarProceso(
            @RequestParam("serviceRequest") String serviceRequest
    ) {
        apuService.deleteProcess(serviceRequest);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ENDPOINTS DE SERVICIOS (APUs INDIVIDUALES)
    // ==========================================

    @GetMapping("/servicios")
    public ResponseEntity<List<ProcessService>> listarServiciosDelProceso(
            @RequestParam("serviceRequest") String serviceRequest
    ) {
        return ResponseEntity.ok(apuService.getServicesByProcess(serviceRequest));
    }

    @GetMapping("/servicios/porId")
    public ResponseEntity<ServiceResponseDTO> obtenerDetalleServicio(
            @RequestParam("serviceId") String serviceId
    ) {
        return ResponseEntity.ok(apuService.getServiceById(serviceId));
    }

    @PostMapping("/servicios")
    public ResponseEntity<ProcessService> crearServicio(
            @RequestParam("serviceRequest") String serviceRequest,
            @RequestBody ServiceRequestDTO dto
    ) {
        ProcessService service = mapServiceDto(dto);
        List<ServiceMaterial> materials = mapMaterials(dto);
        List<ServiceEquipment> equipments = mapEquipments(dto);
        List<ServiceLabor> labors = mapLabors(dto);

        ProcessService saved = apuService.createService(serviceRequest, service, materials, equipments, labors);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/servicios")
    public ResponseEntity<ProcessService> actualizarServicio(
            @RequestParam("serviceId") String serviceId,
            @RequestBody ServiceRequestDTO dto
    ) {
        ProcessService serviceData = mapServiceDto(dto);
        List<ServiceMaterial> materials = mapMaterials(dto);
        List<ServiceEquipment> equipments = mapEquipments(dto);
        List<ServiceLabor> labors = mapLabors(dto);

        ProcessService updated = apuService.updateService(serviceId, serviceData, materials, equipments, labors);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/servicios")
    public ResponseEntity<Void> eliminarServicio(
            @RequestParam("serviceId") String serviceId
    ) {
        apuService.deleteService(serviceId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // MAPPERS INTERNOS
    // ==========================================

    private Process mapProcessDto(ProcessRequestDTO dto) {
        Process process = new Process();
        process.setMainProcess(dto.getMainProcess());
        process.setPower(dto.getPower());
        process.setSerial(dto.getSerial());
        process.setBrand(dto.getBrand());
        process.setLocation(dto.getLocation());

        Company company = new Company();
        company.setId(dto.getCompanyId());
        process.setCompany(company);
        return process;
    }

    private ProcessService mapServiceDto(ServiceRequestDTO dto) {
        ProcessService service = new ProcessService();
        service.setDescription(dto.getDescription());
        service.setItemQuantity(dto.getItemQuantity());
        service.setPerformance(dto.getPerformance());
        service.setSocialLawsPercentage(dto.getSocialLawsPercentage());
        service.setAdminPercentage(dto.getAdminPercentage());
        service.setUtilityContingencyPercentage(dto.getUtilityContingencyPercentage());
        return service;
    }

    private List<ServiceMaterial> mapMaterials(ServiceRequestDTO dto) {
        if (dto.getMaterials() == null) return Collections.emptyList();
        return dto.getMaterials().stream().map(mDto -> {
            ServiceMaterial sm = new ServiceMaterial();
            Material material = new Material();
            material.setId(mDto.getMaterialId());
            sm.setMaterial(material);
            sm.setQuantity(mDto.getQuantity());
            return sm;
        }).collect(Collectors.toList());
    }

    private List<ServiceEquipment> mapEquipments(ServiceRequestDTO dto) {
        if (dto.getEquipments() == null) return Collections.emptyList();
        return dto.getEquipments().stream().map(eDto -> {
            ServiceEquipment se = new ServiceEquipment();
            Equipment equipment = new Equipment();
            equipment.setId(eDto.getEquipmentId());
            se.setEquipment(equipment);
            se.setQuantity(eDto.getQuantity());
            return se;
        }).collect(Collectors.toList());
    }

    private List<ServiceLabor> mapLabors(ServiceRequestDTO dto) {
        if (dto.getLabors() == null) return Collections.emptyList();
        return dto.getLabors().stream().map(lDto -> {
            ServiceLabor sl = new ServiceLabor();
            Labor labor = new Labor();
            labor.setId(lDto.getLaborId());
            sl.setLabor(labor);
            sl.setDotation(lDto.getDotation());
            return sl;
        }).collect(Collectors.toList());
    }
}