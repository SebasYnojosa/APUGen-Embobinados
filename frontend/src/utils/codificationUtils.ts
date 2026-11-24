import type { CodificationType, MotorType } from '../types';

export const CODIFICATION_TYPE_LABELS: Record<CodificationType, string> = {
    mat: 'Materiales (mat)',
    equ: 'Equipos (equ)',
    mdo: 'Mano de Obra (mdo)',
};

export const CODIFICATION_TYPE_SHORT: Record<CodificationType, string> = {
    mat: 'Materiales',
    equ: 'Equipos',
    mdo: 'Mano de Obra',
};

export const MOTOR_TYPE_OPTIONS: { value: MotorType; label: string }[] = [
    { value: 'pequeño', label: 'Pequeño' },
    { value: 'mediano', label: 'Mediano' },
    { value: 'grande', label: 'Grande' },
];

export const ALL_MOTOR_TYPES: MotorType[] = ['pequeño', 'mediano', 'grande'];
export const ALL_MOTOR_TYPES_VALUE = ALL_MOTOR_TYPES.join(',');

export const formatMotorType = (tipoM?: MotorType | ''): string => {
    if (!tipoM) return 'N/A';
    const match = MOTOR_TYPE_OPTIONS.find((opt) => opt.value === tipoM);
    return match ? match.label : tipoM;
};

/**
 * Parsea el valor de `paraTipoM` almacenado en el backend en una lista ordenada de MotorType.
 * Si está vacío o nulo, retorna los 3 tipos (sirve para todos los motores).
 */
export const parseParaTipoM = (raw?: string | null): MotorType[] => {
    if (!raw || !raw.trim()) {
        return [...ALL_MOTOR_TYPES];
    }
    const tokens = new Set(
        raw
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter((t): t is MotorType =>
                ALL_MOTOR_TYPES.includes(t as MotorType)
            )
    );
    if (tokens.size === 0) {
        return [...ALL_MOTOR_TYPES];
    }
    return ALL_MOTOR_TYPES.filter((t) => tokens.has(t));
};

/**
 * Serializa los tipos seleccionados para enviarlos al backend.
 * Seleccionar ninguno o seleccionar los 3 produce el mismo resultado: todos los motores.
 */
export const serializeParaTipoM = (selected: MotorType[]): string => {
    if (selected.length === 0 || selected.length >= ALL_MOTOR_TYPES.length) {
        return ALL_MOTOR_TYPES_VALUE;
    }
    const unique = new Set(selected);
    const ordered = ALL_MOTOR_TYPES.filter((t) => unique.has(t));
    if (ordered.length === 0 || ordered.length === ALL_MOTOR_TYPES.length) {
        return ALL_MOTOR_TYPES_VALUE;
    }
    return ordered.join(',');
};

/**
 * Determina si un elemento de catálogo (con `paraTipoM`) es compatible con el tamaño de motor de la obra.
 * Si la obra no tiene `tipoM` definido, cualquier elemento es compatible.
 */
export const isItemCompatibleWithMotorType = (
    paraTipoM?: string | null,
    processTipoM?: MotorType | '' | null
): boolean => {
    if (!processTipoM) return true;
    return parseParaTipoM(paraTipoM).includes(processTipoM);
};

export const formatParaTipoMLabels = (paraTipoM?: string | null): string => {
    const parsed = parseParaTipoM(paraTipoM);
    if (parsed.length === ALL_MOTOR_TYPES.length) {
        return 'Todos';
    }
    return parsed.map((t) => formatMotorType(t)).join(', ');
};

/**
 * Extrae el prefijo de codificación de 3 caracteres de un ID escrito manualmente.
 * Ejemplos: "DES-001" -> "DES", "BAR" -> "BAR", "BAR01" -> "BAR".
 * Retorna null si el texto no inicia con un código válido de 3 caracteres.
 */
export const extractCodificationPrefix = (rawId: string): string | null => {
    const trimmed = rawId.trim().toUpperCase();
    if (!trimmed) return null;

    const candidate = trimmed.includes('-') ? trimmed.split('-')[0] : trimmed.slice(0, 3);
    if (/^[A-Z0-9]{3}$/.test(candidate)) {
        return candidate;
    }
    return null;
};

/**
 * Aplica una codificación de 3 caracteres al ID actual de un elemento de catálogo.
 * - Si está vacío: "DES-"
 * - Si ya tenía "OLD-001": "DES-001"
 * - Si tenía "001": "DES-001"
 * - Si tenía solo 3 letras ("OLD"): "DES-"
 */
export const applyCodificationToId = (currentId: string, code: string): string => {
    const cleanCode = code.trim().toUpperCase();
    const trimmed = currentId.trim();

    if (!trimmed) {
        return `${cleanCode}-`;
    }

    if (trimmed.includes('-')) {
        const dashIndex = trimmed.indexOf('-');
        const suffix = trimmed.slice(dashIndex + 1);
        return `${cleanCode}-${suffix}`;
    }

    if (/^[A-Za-z]{3}$/.test(trimmed)) {
        return `${cleanCode}-`;
    }

    return `${cleanCode}-${trimmed}`;
};
