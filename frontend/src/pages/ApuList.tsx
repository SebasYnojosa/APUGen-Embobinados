import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apuService } from '../services/apuServices';
import { formatMotorType } from '../utils/codificationUtils';
import { formatDateTime } from '../utils/dateUtils';
import QuickBrandButton from '../components/QuickBrandButton';
import QuickPowerButton from '../components/QuickPowerButton';
import type { Process } from '../types';

export default function ApuList() {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeQuickCreate, setActiveQuickCreate] = useState<'power' | 'brand' | null>(null);

    const fetchProcesses = async () => {
        try {
            setLoading(true);
            const data = await apuService.getAllProcesses();
            setProcesses(data);
            setError(null);
        } catch {
            setError('Error al cargar los procesos desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcesses();
    }, []);

    const handleDelete = async (serviceRequest: string) => {
        if (!confirm(`¿Estás seguro de eliminar el proceso ${serviceRequest} y TODOS sus servicios asociados?`)) return;
        try {
            await apuService.deleteProcess(serviceRequest);
            fetchProcesses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al eliminar el proceso');
        }
    };

    const getTotalProposed = (process: Process) =>
        (process.services || []).reduce((acc, s) => acc + (s.proposedUnitPrice || 0), 0);

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-7xl mx-auto border border-base-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Listado de Procesos (Obras)</h1>
                    <p className="text-sm text-base-content/70">
                        Órdenes de trabajo y sus servicios (APUs) registrados.
                    </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 shrink-0">
                    <QuickPowerButton
                        isOpen={activeQuickCreate === 'power'}
                        onOpenChange={(open) =>
                            setActiveQuickCreate((prev) =>
                                open ? 'power' : prev === 'power' ? null : prev
                            )
                        }
                    />
                    <QuickBrandButton
                        isOpen={activeQuickCreate === 'brand'}
                        onOpenChange={(open) =>
                            setActiveQuickCreate((prev) =>
                                open ? 'brand' : prev === 'brand' ? null : prev
                            )
                        }
                    />
                    <Link to="/apus/nuevo" className="btn btn-primary btn-sm whitespace-nowrap">+ Nuevo Proceso</Link>
                </div>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                    <tr>
                        <th>Orden / Solicitud</th>
                        <th>Empresa</th>
                        <th>Proceso Principal</th>
                        <th>Equipo (Marca / Potencia / Tipo)</th>
                        <th className="text-center">Servicios</th>
                        <th className="text-right">Total Propuesto</th>
                        <th className="whitespace-nowrap">Fechas</th>
                        <th className="text-center whitespace-nowrap">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={8} className="text-center py-6">Cargando procesos...</td></tr>
                    ) : processes.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-6">No hay procesos registrados.</td></tr>
                    ) : (
                        processes.map((proc) => {
                            const servicesCount = proc.services?.length || 0;
                            const totalProposed = getTotalProposed(proc);
                            const specSummary =
                                [
                                    proc.brand,
                                    proc.power,
                                    proc.tipoM ? `Motor ${formatMotorType(proc.tipoM)}` : '',
                                ]
                                    .filter(Boolean)
                                    .join(' / ') || 'N/A';

                            return (
                                <tr key={proc.serviceRequest}>
                                    <td className="font-semibold whitespace-nowrap">{proc.serviceRequest}</td>
                                    <td>{proc.company?.name || proc.company?.id}</td>
                                    <td>{proc.mainProcess}</td>
                                    <td className="text-sm text-base-content/70">{specSummary}</td>
                                    <td className="text-center">
                                        <span className="badge badge-neutral badge-sm">{servicesCount}</span>
                                    </td>
                                    <td className="text-right font-bold text-primary whitespace-nowrap">
                                        ${totalProposed.toLocaleString('en-US')}
                                    </td>
                                    <td className="text-xs text-base-content/70 whitespace-nowrap tabular-nums leading-tight">
                                        <div><span className="font-semibold">Creado:</span> {formatDateTime(proc.createdAt)}</div>
                                        <div><span className="font-semibold">Act.:</span> {formatDateTime(proc.updatedAt)}</div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Link
                                                to={`/apus/detalle?serviceRequest=${encodeURIComponent(proc.serviceRequest)}`}
                                                className="btn btn-xs btn-outline btn-info whitespace-nowrap"
                                                title="Ver obra y servicios"
                                            >
                                                Ver Obra
                                            </Link>
                                            <Link
                                                to={`/apus/editar?serviceRequest=${encodeURIComponent(proc.serviceRequest)}`}
                                                className="btn btn-xs btn-outline btn-warning whitespace-nowrap"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                className="btn btn-xs btn-outline btn-error whitespace-nowrap"
                                                onClick={() => handleDelete(proc.serviceRequest)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}