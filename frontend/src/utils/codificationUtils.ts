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

export const formatMotorType = (tipoM?: MotorType | ''): string => {
    if (!tipoM) return 'N/A';
    const match = MOTOR_TYPE_OPTIONS.find((opt) => opt.value === tipoM);
    return match ? match.label : tipoM;
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
