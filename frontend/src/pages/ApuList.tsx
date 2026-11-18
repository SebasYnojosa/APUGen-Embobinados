import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apuService } from '../services/apuServices';
import type { Process } from '../types';

export default function ApuList() {
    const [apus, setApus] = useState<Process[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApus = async () => {
        try {
            setLoading(true);
            const data = await apuService.getAllApus();
            setApus(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar los APUs desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApus();
    }, []);

    const handleDelete = async (serviceRequest: string) => {
        if (!confirm(`¿Estás seguro de eliminar el APU con orden: ${serviceRequest}?`)) return;
        try {
            await apuService.deleteApu(serviceRequest);
            fetchApus();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al eliminar el APU');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-7xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Listado de APUs</h1>
                    <p className="text-sm text-base-content/70">Presupuestos y análisis de precios unitarios registrados.</p>
                </div>
                <Link to="/apus/nuevo" className="btn btn-primary btn-sm">+ Nuevo APU</Link>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                    <tr>
                        <th>Orden / Solicitud</th>
                        <th>Empresa</th>
                        <th>Proceso Principal</th>
                        <th>Descripción</th>
                        <th>Precio Propuesto</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-6">Cargando APUs...</td></tr>
                    ) : apus.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-6">No hay APUs registrados.</td></tr>
                    ) : (
                        apus.map((apu) => (
                            <tr key={apu.serviceRequest}>
                                <td className="font-semibold">{apu.serviceRequest}</td>
                                <td>{apu.company?.name || apu.company?.id}</td>
                                <td>{apu.mainProcess}</td>
                                <td>{apu.description}</td>
                                <td className="font-bold text-primary">${apu.proposedUnitPrice?.toLocaleString()}</td>
                                <td className="text-center space-x-2">
                                    <Link
                                        to={`/apus/detalle?serviceRequest=${encodeURIComponent(apu.serviceRequest)}`}
                                        className="btn btn-xs btn-outline btn-info"
                                    >
                                        Ver Detalles
                                    </Link>
                                    <Link
                                        to={`/apus/editar?serviceRequest=${encodeURIComponent(apu.serviceRequest)}`}
                                        className="btn btn-xs btn-outline btn-warning"
                                    >
                                        Editar
                                    </Link>
                                    <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(apu.serviceRequest)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}