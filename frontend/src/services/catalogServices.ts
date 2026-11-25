import api from './api';
import type {
    Brand,
    BrandRequest,
    CatalogCodification,
    CatalogCodificationRequest,
    CodificationType,
    Company,
    Equipment,
    Labor,
    Material,
    Power,
    PowerRequest,
} from '../types';

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
        const response = await api.put<Company>(`/catalogos/empresas?id=${encodeURIComponent(id)}`, company);
        return response.data;
    },
    deleteCompany: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/empresas?id=${encodeURIComponent(id)}`);
    },

    // ==========================================
    // MARCAS
    // ==========================================
    getBrands: async (): Promise<Brand[]> => {
        const response = await api.get<Brand[]>('/catalogos/marcas');
        return response.data;
    },
    createBrand: async (payload: BrandRequest): Promise<Brand> => {
        const response = await api.post<Brand>('/catalogos/marcas', payload);
        return response.data;
    },
    updateBrand: async (id: string, payload: BrandRequest): Promise<Brand> => {
        const response = await api.put<Brand>(
            `/catalogos/marcas?id=${encodeURIComponent(id)}`,
            payload
        );
        return response.data;
    },
    deleteBrand: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/marcas?id=${encodeURIComponent(id)}`);
    },

    // ==========================================
    // POTENCIAS
    // ==========================================
    getPowers: async (): Promise<Power[]> => {
        const response = await api.get<Power[]>('/catalogos/potencias');
        return response.data;
    },
    createPower: async (payload: PowerRequest): Promise<Power> => {
        const response = await api.post<Power>('/catalogos/potencias', payload);
        return response.data;
    },
    updatePower: async (id: string, payload: PowerRequest): Promise<Power> => {
        const response = await api.put<Power>(
            `/catalogos/potencias?id=${encodeURIComponent(id)}`,
            payload
        );
        return response.data;
    },
    deletePower: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/potencias?id=${encodeURIComponent(id)}`);
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
        const response = await api.put<Material>(`/catalogos/materiales?id=${encodeURIComponent(id)}`, material);
        return response.data;
    },
    deleteMaterial: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/materiales?id=${encodeURIComponent(id)}`);
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
        const response = await api.put<Equipment>(`/catalogos/equipos?id=${encodeURIComponent(id)}`, equipment);
        return response.data;
    },
    deleteEquipment: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/equipos?id=${encodeURIComponent(id)}`);
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
        const response = await api.put<Labor>(`/catalogos/cargos?id=${encodeURIComponent(id)}`, labor);
        return response.data;
    },
    deleteLabor: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/cargos?id=${encodeURIComponent(id)}`);
    },

    // ==========================================
    // CODIFICACIONES DEL CATÁLOGO
    // ==========================================
    getCodifications: async (tipo?: CodificationType): Promise<CatalogCodification[]> => {
        const response = await api.get<CatalogCodification[]>('/catalogos/codificaciones', {
            params: tipo ? { tipo } : undefined,
        });
        return response.data;
    },
    createCodification: async (
        payload: CatalogCodificationRequest
    ): Promise<CatalogCodification> => {
        const response = await api.post<CatalogCodification>('/catalogos/codificaciones', payload);
        return response.data;
    },
    updateCodification: async (
        id: string,
        payload: CatalogCodificationRequest
    ): Promise<CatalogCodification> => {
        const response = await api.put<CatalogCodification>(
            `/catalogos/codificaciones?id=${encodeURIComponent(id)}`,
            payload
        );
        return response.data;
    },
    deleteCodification: async (id: string): Promise<void> => {
        await api.delete(`/catalogos/codificaciones?id=${encodeURIComponent(id)}`);
    },
};