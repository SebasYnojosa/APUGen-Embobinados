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

// ==========================================
// DETALLES DEL PROCESO (SNAPSHOTS)
// ==========================================
export interface ProcessMaterial {
    id: string;
    material: Material;
    descriptionSnapshot: string;
    unitSnapshot: string;
    costApplied: number;
    quantity: number;
    amount: number;
}

export interface ProcessEquipment {
    id: string;
    equipment: Equipment;
    descriptionSnapshot: string;
    valueApplied: number;
    depreciationFactorApplied: number;
    quantity: number;
    dailyUseCost: number;
}

export interface ProcessLabor {
    id: string;
    labor: Labor;
    descriptionSnapshot: string;
    dailyWageApplied: number;
    dotation: number;
    dailyCost: number;
}

// ==========================================
// CABECERA DEL APU (PROCESO)
// ==========================================
export interface Process {
    serviceRequest: string;
    company: Company;
    mainProcess: string;
    description: string;
    power?: string;    // Opcional
    serial?: string;   // Opcional
    brand?: string;    // Opcional
    location?: string;
    
    // Variables de Cálculo
    itemQuantity: number;
    performance: number;
    socialLawsPercentage: number;
    adminPercentage: number;
    utilityContingencyPercentage: number;
    
    // Totales
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
// DTO DE RESPUESTA COMPLETA (Para el endpoint GET)
// ==========================================
export interface ApuResponseDTO {
    process: Process;
    materials: ProcessMaterial[];
    equipments: ProcessEquipment[];
    labors: ProcessLabor[];
    totalMaterials: number;
    totalEquipmentsDaily: number;
    totalLaborsBase: number;
    socialLawsCost: number;
    totalLaborsDaily: number;
}