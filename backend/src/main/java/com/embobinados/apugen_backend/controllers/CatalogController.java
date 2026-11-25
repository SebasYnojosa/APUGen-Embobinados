package com.embobinados.apugen_backend.controllers;

import com.embobinados.apugen_backend.entity.CatalogCodification;
import com.embobinados.apugen_backend.entity.Company;
import com.embobinados.apugen_backend.entity.Equipment;
import com.embobinados.apugen_backend.entity.Labor;
import com.embobinados.apugen_backend.entity.Material;
import com.embobinados.apugen_backend.repository.CatalogCodificationRepository;
import com.embobinados.apugen_backend.repository.CompanyRepository;
import com.embobinados.apugen_backend.repository.EquipmentRepository;
import com.embobinados.apugen_backend.repository.LaborRepository;
import com.embobinados.apugen_backend.repository.MaterialRepository;
import com.embobinados.apugen_backend.utilz.MotorTypeUtil;
import com.embobinados.apugen_backend.utilz.StringUtilz;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
public class CatalogController {

    private static final Set<String> VALID_CODIFICATION_TYPES = Set.of("mat", "equ", "mdo");

    // Inyección de dependencias de los repositorios maestros
    private final CompanyRepository companyRepository;
    private final MaterialRepository materialRepository;
    private final EquipmentRepository equipmentRepository;
    private final LaborRepository laborRepository;
    private final CatalogCodificationRepository catalogCodificationRepository;



    @GetMapping("/empresas")
    public ResponseEntity<List<Company>> getCompanies() {
        // findAll() ejecuta un "SELECT * FROM companies" automáticamente
        return ResponseEntity.ok(companyRepository.findAll());
    }

    // @GetMapping("/empresas/{id}")
    @GetMapping("/empresas/porId")
    public ResponseEntity<Company> getEmpresa(
            @RequestParam("id") String id
    ) {
        Company empresa = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró la empresa con ID: " + id));

        return ResponseEntity.ok(empresa);
    }

    @GetMapping("/empresas/porNombre")
    public ResponseEntity<List<Company>> getEmpresasPorNombre(
            @RequestParam("nombre") String nombre
    ) {
        String palabraBusqueda = StringUtilz.prepararFiltro(nombre, false);

        if (palabraBusqueda == null) {
            return ResponseEntity.ok(companyRepository.findAll());
        }

        return ResponseEntity.ok(companyRepository.buscarPorNombre(palabraBusqueda));
    }

    @PostMapping("/empresas")
    public ResponseEntity<Company> crearEmpresa(@RequestBody Company empresa) {
        // Validación crucial por usar IDs manuales
        if (empresa.getId() == null) {
            throw new RuntimeException("El ID de la empresa es obligatorio.");
        }
        if (companyRepository.existsById(empresa.getId())) {
            throw new RuntimeException("Ya existe una empresa registrada con el ID: " + empresa.getId());
        }
        return ResponseEntity.ok(companyRepository.save(empresa));
    }

    // @PutMapping("/empresas/{id}")
    @PutMapping("/empresas")
    public ResponseEntity<Company> actualizarEmpresa(
            @RequestParam("id") String id,
            @RequestBody Company detalles)
    {
        Company empresa = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró la empresa con ID: " + id));

        empresa.setName(detalles.getName());
        empresa.touchUpdatedAt();

        return ResponseEntity.ok(companyRepository.save(empresa));
    }

    // @DeleteMapping("/empresas/{id}")
    @DeleteMapping("/empresas")
    public ResponseEntity<Void> borrarEmpresa(
            @RequestParam("id") String id
    ) {
        if (!companyRepository.existsById(id)) {
            throw new RuntimeException("No se encontró la empresa con ID: " + id);
        }
        try {
            companyRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("No se puede borrar la empresa porque está siendo usada en un APU.");
        }
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // CRUD PARA MATERIALES
    // ==========================================

    @GetMapping("/materiales")
    public ResponseEntity<List<Material>> getMaterials() {
        return ResponseEntity.ok(materialRepository.findAll());
    }

    // @GetMapping("/materiales/{id}")
    @GetMapping("/materiales/porId")
    public ResponseEntity<Material> getMaterial(
            @RequestParam("id") String id
    ) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el material con ID: " + id));

        return ResponseEntity.ok(material);
    }

    @GetMapping("/materiales/porDescripcion")
    public ResponseEntity<List<Material>> buscarMaterialesPorDescripcion(
            @RequestParam("descripcion") String descripcion
    ) {
        String filtro = StringUtilz.prepararFiltro(descripcion, false);
        if (filtro == null) {
            return ResponseEntity.ok(materialRepository.findAll());
        }
        return ResponseEntity.ok(materialRepository.buscarPorDescripcion(filtro));
    }

    @PostMapping("/materiales")
    public ResponseEntity<Material> crearMaterial(@RequestBody Material material) {
        // Validación crucial por usar IDs manuales
        if (material.getId() == null) {
            throw new RuntimeException("El ID del material es obligatorio.");
        }
        if (materialRepository.existsById(material.getId())) {
            throw new RuntimeException("Ya existe un material registrado con el ID: " + material.getId());
        }
        material.setParaTipoM(MotorTypeUtil.normalizeParaTipoM(material.getParaTipoM()));
        return ResponseEntity.ok(materialRepository.save(material));
    }

    // @PutMapping("/materiales/{id}")
    @PutMapping("/materiales")
    public ResponseEntity<Material> actualizarMaterial(
            @RequestParam("id") String id,
            @RequestBody Material detalles
    ) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el material con ID: " + id));

        material.setDescription(detalles.getDescription());
        material.setUnit(detalles.getUnit());
        material.setBaseCost(detalles.getBaseCost());
        material.setParaTipoM(MotorTypeUtil.normalizeParaTipoM(detalles.getParaTipoM()));
        material.touchUpdatedAt();

        return ResponseEntity.ok(materialRepository.save(material));
    }

    // @DeleteMapping("/materiales/{id}")
    @DeleteMapping("/materiales")
    public ResponseEntity<Void> borrarMaterial(
            @RequestParam("id") String id
    ) {
        if (!materialRepository.existsById(id)) {
            throw new RuntimeException("No se encontró el material con ID: " + id);
        }
        try {
            materialRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("No se puede borrar el material porque está siendo usado en un APU.");
        }
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // CRUD PARA EQUIPOS
    // ==========================================

    @GetMapping("/equipos")
    public ResponseEntity<List<Equipment>> getEquipments() {
        return ResponseEntity.ok(equipmentRepository.findAll());
    }

    // @GetMapping("/equipos/{id}")
    @GetMapping("/equipos/porId")
    public ResponseEntity<Equipment> getEquipo(
            @RequestParam("id") String id
    ) {
        Equipment equipo = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el equipo con ID: " + id));

        return ResponseEntity.ok(equipo);
    }

    @GetMapping("/equipos/porDescripcion")
    public ResponseEntity<List<Equipment>> buscarEquiposPorDescripcion(
            @RequestParam("descripcion") String descripcion
    ) {
        String filtro = StringUtilz.prepararFiltro(descripcion, false);
        if (filtro == null) {
            return ResponseEntity.ok(equipmentRepository.findAll());
        }
        return ResponseEntity.ok(equipmentRepository.buscarPorDescripcion(filtro));
    }

    @PostMapping("/equipos")
    public ResponseEntity<Equipment> crearEquipo(@RequestBody Equipment equipo) {
        // Validación crucial por usar IDs manuales
        if (equipo.getId() == null) {
            throw new RuntimeException("El ID del equipo es obligatorio.");
        }
        if (equipmentRepository.existsById(equipo.getId())) {
            throw new RuntimeException("Ya existe un equipo registrado con el ID: " + equipo.getId());
        }
        validarFactorDepreciacion(equipo.getDepreciationFactor());
        equipo.setParaTipoM(MotorTypeUtil.normalizeParaTipoM(equipo.getParaTipoM()));
        return ResponseEntity.ok(equipmentRepository.save(equipo));
    }

    // @PutMapping("/equipos/{id}")
    @PutMapping("/equipos")
    public ResponseEntity<Equipment> actualizarEquipo(
            @RequestParam("id") String id,
            @RequestBody Equipment detalles
    ) {
        Equipment equipo = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el equipo con ID: " + id));

        validarFactorDepreciacion(detalles.getDepreciationFactor());

        equipo.setDescription(detalles.getDescription());
        equipo.setBaseValue(detalles.getBaseValue());
        equipo.setDepreciationFactor(detalles.getDepreciationFactor());
        equipo.setParaTipoM(MotorTypeUtil.normalizeParaTipoM(detalles.getParaTipoM()));
        equipo.touchUpdatedAt();

        return ResponseEntity.ok(equipmentRepository.save(equipo));
    }

    private void validarFactorDepreciacion(BigDecimal depreciationFactor) {
        if (depreciationFactor == null || depreciationFactor.compareTo(BigDecimal.ZERO) == 0) {
            throw new RuntimeException("El factor de depreciación no puede ser 0.");
        }
        if (depreciationFactor.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El factor de depreciación debe ser mayor que 0.");
        }
    }

    // @DeleteMapping("/equipos/{id}")
    @DeleteMapping("/equipos")
    public ResponseEntity<Void> borrarEquipo(
            @RequestParam("id") String id
    ) {
        if (!equipmentRepository.existsById(id)) {
            throw new RuntimeException("No se encontró el equipo con ID: " + id);
        }
        try {
            equipmentRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("No se puede borrar el equipo porque está siendo usado en un APU.");
        }
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // CRUD PARA MANO DE OBRA (CARGOS)
    // ==========================================

    @GetMapping("/cargos")
    public ResponseEntity<List<Labor>> getLabors() {
        return ResponseEntity.ok(laborRepository.findAll());
    }

    // @GetMapping("/cargos/{id}")
    @GetMapping("/cargos/porId")
    public ResponseEntity<Labor> getCargo(
            @RequestParam("id") String id
    ) {
        Labor cargo = laborRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el cargo con ID: " + id));

        return ResponseEntity.ok(cargo);
    }

    @PostMapping("/cargos")
    public ResponseEntity<Labor> crearCargo(@RequestBody Labor cargo) {
        // Validación crucial por usar IDs manuales
        if (cargo.getId() == null) {
            throw new RuntimeException("El ID del cargo es obligatorio.");
        }
        if (laborRepository.existsById(cargo.getId())) {
            throw new RuntimeException("Ya existe un cargo registrado con el ID: " + cargo.getId());
        }
        cargo.setParaTipoM(MotorTypeUtil.normalizeParaTipoM(cargo.getParaTipoM()));
        return ResponseEntity.ok(laborRepository.save(cargo));
    }

    // @PutMapping("/cargos/{id}")
    @PutMapping("/cargos")
    public ResponseEntity<Labor> actualizarCargo(
            @RequestParam("id") String id,
            @RequestBody Labor detalles
    ) {
        Labor cargo = laborRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el cargo con ID: " + id));

        cargo.setDescription(detalles.getDescription());
        cargo.setBaseDailyWage(detalles.getBaseDailyWage());
        cargo.setParaTipoM(MotorTypeUtil.normalizeParaTipoM(detalles.getParaTipoM()));
        cargo.touchUpdatedAt();

        return ResponseEntity.ok(laborRepository.save(cargo));
    }

    // @DeleteMapping("/cargos/{id}")
    @DeleteMapping("/cargos")
    public ResponseEntity<Void> borrarCargo(
            @RequestParam("id") String id
    ) {
        if (!laborRepository.existsById(id)) {
            throw new RuntimeException("No se encontró el cargo con ID: " + id);
        }
        try {
            laborRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("No se puede borrar el cargo porque está siendo usado en un APU.");
        }
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // CRUD PARA CODIFICACIONES DEL CATÁLOGO
    // ==========================================

    @GetMapping("/codificaciones")
    public ResponseEntity<List<CatalogCodification>> listarCodificaciones(
            @RequestParam(value = "tipo", required = false) String tipo
    ) {
        if (tipo != null && !tipo.isBlank()) {
            String normalizedType = validarTipoCodificacion(tipo);
            return ResponseEntity.ok(catalogCodificationRepository.findByTypeOrderByCodeAsc(normalizedType));
        }
        return ResponseEntity.ok(catalogCodificationRepository.findAllByOrderByTypeAscCodeAsc());
    }

    @PostMapping("/codificaciones")
    public ResponseEntity<CatalogCodification> crearCodificacion(@RequestBody CatalogCodification codificacion) {
        String normalizedCode = validarCodigoCodificacion(codificacion.getCode());
        if (catalogCodificationRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new RuntimeException("Ya existe una codificación registrada con el código: " + normalizedCode);
        }
        String description = validarDescripcionCodificacion(codificacion.getDescription());
        String normalizedType = validarTipoCodificacion(codificacion.getType());

        CatalogCodification nueva = new CatalogCodification();
        nueva.setCode(normalizedCode);
        nueva.setDescription(description);
        nueva.setType(normalizedType);

        return ResponseEntity.ok(catalogCodificationRepository.save(nueva));
    }

    @PutMapping("/codificaciones")
    public ResponseEntity<CatalogCodification> actualizarCodificacion(
            @RequestParam("id") String id,
            @RequestBody CatalogCodification detalles
    ) {
        CatalogCodification existente = catalogCodificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró la codificación con ID: " + id));

        String normalizedCode = validarCodigoCodificacion(detalles.getCode());
        if (!existente.getCode().equalsIgnoreCase(normalizedCode)
                && catalogCodificationRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new RuntimeException("Ya existe una codificación registrada con el código: " + normalizedCode);
        }
        String description = validarDescripcionCodificacion(detalles.getDescription());
        String normalizedType = validarTipoCodificacion(detalles.getType());

        existente.setCode(normalizedCode);
        existente.setDescription(description);
        existente.setType(normalizedType);
        existente.touchUpdatedAt();

        return ResponseEntity.ok(catalogCodificationRepository.save(existente));
    }

    @DeleteMapping("/codificaciones")
    public ResponseEntity<Void> borrarCodificacion(@RequestParam("id") String id) {
        if (!catalogCodificationRepository.existsById(id)) {
            throw new RuntimeException("No se encontró la codificación con ID: " + id);
        }
        catalogCodificationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String validarCodigoCodificacion(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new RuntimeException("El código de codificación es obligatorio.");
        }
        String cleaned = rawCode.trim().toUpperCase();
        if (cleaned.length() != 3 || cleaned.contains(" ")) {
            throw new RuntimeException("El código debe tener exactamente 3 caracteres sin espacios (Ej: DES, BAR).");
        }
        return cleaned;
    }

    private String validarDescripcionCodificacion(String rawDescription) {
        if (rawDescription == null || rawDescription.isBlank()) {
            throw new RuntimeException("La descripción de la codificación es obligatoria.");
        }
        return rawDescription.trim();
    }

    private String validarTipoCodificacion(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            throw new RuntimeException("El tipo de catálogo es obligatorio (mat, equ o mdo).");
        }
        String normalized = rawType.trim().toLowerCase();
        if (!VALID_CODIFICATION_TYPES.contains(normalized)) {
            throw new RuntimeException("Tipo de catálogo inválido. Debe ser 'mat', 'equ' o 'mdo'.");
        }
        return normalized;
    }
}