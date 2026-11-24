package com.embobinados.apugen_backend.utilz;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class MotorTypeUtil {

    public static final List<String> VALID_TYPES_ORDERED = List.of("pequeño", "mediano", "grande");
    public static final String ALL_MOTOR_TYPES = String.join(",", VALID_TYPES_ORDERED);

    private MotorTypeUtil() {
    }

    /**
     * Normaliza y valida un único tipo de motor (para Process.tipoM).
     * Permite null o vacío cuando la obra no tiene tipo definido.
     */
    public static String normalizeSingleMotorType(String rawTipoM) {
        if (rawTipoM == null || rawTipoM.isBlank()) {
            return null;
        }
        String normalized = rawTipoM.trim().toLowerCase();
        if (!VALID_TYPES_ORDERED.contains(normalized)) {
            throw new RuntimeException("Tipo de motor inválido. Debe ser pequeño, mediano o grande.");
        }
        return normalized;
    }

    /**
     * Normaliza y valida el campo para_tipo_m de los catálogos.
     * Si es null, vacío o contiene los 3 tipos, retorna "pequeño,mediano,grande".
     */
    public static String normalizeParaTipoM(String rawParaTipoM) {
        if (rawParaTipoM == null || rawParaTipoM.isBlank()) {
            return ALL_MOTOR_TYPES;
        }

        Set<String> selected = new LinkedHashSet<>();
        for (String token : rawParaTipoM.split(",")) {
            String normalized = token.trim().toLowerCase();
            if (normalized.isEmpty()) {
                continue;
            }
            if (!VALID_TYPES_ORDERED.contains(normalized)) {
                throw new RuntimeException(
                        "Valor inválido en para_tipo_m: '" + token.trim() + "'. Solo se permiten pequeño, mediano o grande."
                );
            }
            selected.add(normalized);
        }

        if (selected.isEmpty() || selected.size() == VALID_TYPES_ORDERED.size()) {
            return ALL_MOTOR_TYPES;
        }

        return VALID_TYPES_ORDERED.stream()
                .filter(selected::contains)
                .collect(Collectors.joining(","));
    }

    /**
     * Verifica si un elemento de catálogo (con paraTipoM) es compatible con el tipo de motor de una obra.
     * Si la obra no tiene tipo definido o el elemento no tiene restricción, retorna true.
     */
    public static boolean isCompatible(String paraTipoM, String processTipoM) {
        if (processTipoM == null || processTipoM.isBlank()) {
            return true;
        }
        String target = processTipoM.trim().toLowerCase();
        String normalizedAllowed = normalizeParaTipoM(paraTipoM);

        for (String token : normalizedAllowed.split(",")) {
            if (token.trim().equals(target)) {
                return true;
            }
        }
        return false;
    }
}
