import api from './api';
import type { Company, Material, Equipment, Labor } from '../types';

export const catalogService = {
    // ==========================================
    // EMPRESAS
    // ==========================================
    getCompanies: async (): Promise<Company[]> => {
        const response = await api.get<Company[]>('/catalogos/empresas');
        return response.data;
    },
    createCompany: async (company: Company): Promise<Company> => {
        const response = await api.post<Company>('/catalogos/empresas', company);
        return response.data;
    },
    updateCompany: async (id: string, company: Partial<Company>): Promise<Company> => {
        const response = await api.put<Company>(`/catalogos/empresas?id=${id}`, company);
        return response.data;
    },
    deleteCompany: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/empresas?id=${id}`);
    },

    // ==========================================
    // MATERIALES
    // ==========================================
    getMaterials: async (): Promise<Material[]> => {
        const response = await api.get<Material[]>('/catalogos/materiales');
        return response.data;
    },
    createMaterial: async (material: Material): Promise<Material> => {
        const response = await api.post<Material>('/catalogos/materiales', material);
        return response.data;
    },
    updateMaterial: async (id: string, material: Partial<Material>): Promise<Material> => {
        const response = await api.put<Material>(`/catalogos/materiales?id=${id}`, material);
        return response.data;
    },
    deleteMaterial: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/materiales?id=${id}`);
    },

    // ==========================================
    // EQUIPOS
    // ==========================================
    getEquipments: async (): Promise<Equipment[]> => {
        const response = await api.get<Equipment[]>('/catalogos/equipos');
        return response.data;
    },
    createEquipment: async (equipment: Equipment): Promise<Equipment> => {
        const response = await api.post<Equipment>('/catalogos/equipos', equipment);
        return response.data;
    },
    updateEquipment: async (id: string, equipment: Partial<Equipment>): Promise<Equipment> => {
        const response = await api.put<Equipment>(`/catalogos/equipos?id=${id}`, equipment);
        return response.data;
    },
    deleteEquipment: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/equipos?id=${id}`);
    },

    // ==========================================
    // MANO DE OBRA (CARGOS)
    // ==========================================
    getLabors: async (): Promise<Labor[]> => {
        const response = await api.get<Labor[]>('/catalogos/cargos');
        return response.data;
    },
    createLabor: async (labor: Labor): Promise<Labor> => {
        const response = await api.post<Labor>('/catalogos/cargos', labor);
        return response.data;
    },
    updateLabor: async (id: string, labor: Partial<Labor>): Promise<Labor> => {
        const response = await api.put<Labor>(`/catalogos/cargos?id=${id}`, labor);
        return response.data;
    },
    deleteLabor: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/cargos?id=${id}`);
    }
};