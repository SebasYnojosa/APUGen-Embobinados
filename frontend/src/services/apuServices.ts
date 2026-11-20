import api from './api';
import type {
    Process,
    ProcessRequestDTO,
    ProcessResponseDTO,
    ProcessService,
    ServiceRequestDTO,
    ServiceResponseDTO,
} from '../types';

export const apuService = {
    // ==========================================
    // PROCESOS (OBRAS)
    // ==========================================
    getAllProcesses: async (): Promise<Process[]> => {
        const response = await api.get<Process[]>('/apus');
        return response.data;
    },

    searchProcesses: async (filters: Record<string, string | number | boolean>): Promise<Process[]> => {
        const response = await api.get<Process[]>('/apus/buscar', { params: filters });
        return response.data;
    },

    getProcessByServiceRequest: async (serviceRequest: string): Promise<ProcessResponseDTO> => {
        const response = await api.get<ProcessResponseDTO>('/apus/porOrden', {
            params: { serviceRequest },
        });
        return response.data;
    },

    createProcess: async (processDTO: ProcessRequestDTO): Promise<Process> => {
        const response = await api.post<Process>('/apus', processDTO);
        return response.data;
    },

    updateProcess: async (serviceRequest: string, processDTO: ProcessRequestDTO): Promise<Process> => {
        const response = await api.put<Process>('/apus', processDTO, {
            params: { serviceRequest },
        });
        return response.data;
    },

    deleteProcess: async (serviceRequest: string): Promise<void> => {
        await api.delete('/apus', {
            params: { serviceRequest },
        });
    },

    // ==========================================
    // SERVICIOS (APUs INDIVIDUALES DE UNA OBRA)
    // ==========================================
    getServicesByProcess: async (serviceRequest: string): Promise<ProcessService[]> => {
        const response = await api.get<ProcessService[]>('/apus/servicios', {
            params: { serviceRequest },
        });
        return response.data;
    },

    getServiceById: async (serviceId: string): Promise<ServiceResponseDTO> => {
        const response = await api.get<ServiceResponseDTO>('/apus/servicios/porId', {
            params: { serviceId },
        });
        return response.data;
    },

    createService: async (serviceRequest: string, serviceDTO: ServiceRequestDTO): Promise<ProcessService> => {
        const response = await api.post<ProcessService>('/apus/servicios', serviceDTO, {
            params: { serviceRequest },
        });
        return response.data;
    },

    updateService: async (serviceId: string, serviceDTO: ServiceRequestDTO): Promise<ProcessService> => {
        const response = await api.put<ProcessService>('/apus/servicios', serviceDTO, {
            params: { serviceId },
        });
        return response.data;
    },

    deleteService: async (serviceId: string): Promise<void> => {
        await api.delete('/apus/servicios', {
            params: { serviceId },
        });
    },
};