// ==========================================
// CATÁLOGOS MAESTROS
// ==========================================
export interface Company {
    id: string;
    name: string;
}

export interface Material {
    id: string;
    description: string;
    unit: string;
    baseCost: number;
}

export interface Equipment {
    id: string;
    description: string;
    baseValue: number;
    depreciationFactor: number;
}

export interface Labor {
    id: string;
    description: string;
    baseDailyWage: number;
}

export type CodificationType = 'mat' | 'equ' | 'mdo';

export interface CatalogCodification {
    id: string;
    code: string;
    description: string;
    type: CodificationType;
}

export interface CatalogCodificationRequest {
    code: string;
    description: string;
    type: CodificationType;
}

export type MotorType = 'pequeño' | 'mediano' | 'grande';

// ==========================================
// DETALLES DEL SERVICIO (SNAPSHOTS)
// ==========================================
export interface ServiceMaterial {
    id: string;
    material: Material;
    descriptionSnapshot: string;
    unitSnapshot: string;
    costApplied: number;
    quantity: number;
    amount: number;
}

export interface ServiceEquipment {
    id: string;
    equipment: Equipment;
    descriptionSnapshot: string;
    valueApplied: number;
    depreciationFactorApplied: number;
    quantity: number;
    dailyUseCost: number;
}

export interface ServiceLabor {
    id: string;
    labor: Labor;
    descriptionSnapshot: string;
    dailyWageApplied: number;
    dotation: number;
    dailyCost: number;
}

// ==========================================
// SERVICIO INDIVIDUAL (APU DE UNA OBRA)
// ==========================================
export interface ProcessService {
    id: string; // Ej: SR-2026-001-0
    description: string;

    // Variables de Cálculo
    itemQuantity: number;
    performance: number;
    socialLawsPercentage: number;
    adminPercentage: number;
    utilityContingencyPercentage: number;

    // Totales Calculados
    materialUnitCost: number;
    equipmentUnitCost: number;
    laborUnitCost: number;
    directUnitCost: number;
    adminCostValue: number;
    totalUnitCost: number;
    utilityCostValue: number;
    calculatedUnitPrice: number;
    proposedUnitPrice: number;
}

// ==========================================
// CABECERA DEL PROCESO (OBRA COMPLETA)
// ==========================================
export interface Process {
    serviceRequest: string;
    company: Company;
    mainProcess: string;
    power?: string;
    tipoM?: MotorType | '';
    serial?: string;
    brand?: string;
    location?: string;
    services?: ProcessService[];
}

// ==========================================
// DTOs DE PETICIÓN Y RESPUESTA
// ==========================================
export interface ProcessRequestDTO {
    serviceRequest: string;
    companyId: string;
    mainProcess: string;
    power?: string;
    tipoM?: MotorType | '';
    serial?: string;
    brand?: string;
    location?: string;
}

export interface ProcessResponseDTO {
    process: Process;
    services: ProcessService[];
    servicesCount: number;
    totalCalculatedPrice: number;
    totalProposedPrice: number;
}

export interface ServiceRequestDTO {
    description: string;
    itemQuantity: number;
    performance: number;
    socialLawsPercentage: number;
    adminPercentage: number;
    utilityContingencyPercentage: number;
    materials: { materialId: string; quantity: number }[];
    equipments: { equipmentId: string; quantity: number }[];
    labors: { laborId: string; dotation: number }[];
}

export interface ServiceResponseDTO {
    process: Process;
    service: ProcessService;
    materials: ServiceMaterial[];
    equipments: ServiceEquipment[];
    labors: ServiceLabor[];
    totalMaterials: number;
    totalEquipmentsDaily: number;
    totalLaborsBase: number;
    socialLawsCost: number;
    totalLaborsDaily: number;
}

// ==========================================
// AUTENTICACIÓN Y USUARIOS
// ==========================================
export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    active: boolean;
    mustChangePassword: boolean;
    createdAt: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface CreateUserRequest {
    username: string;
    fullName: string;
    password: string;
    role: UserRole;
    mustChangePassword: boolean;
}

export interface UpdateUserRequest {
    fullName: string;
    role: UserRole;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ResetPasswordRequest {
    newPassword: string;
    mustChangePassword: boolean;
}