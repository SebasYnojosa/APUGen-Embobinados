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

    const buildSpecSummary = (proc: Process) =>
        [
            proc.brand,
            proc.power,
            proc.tipoM ? `Motor ${formatMotorType(proc.tipoM)}` : '',
        ]
            .filter(Boolean)
            .join(' / ') || 'N/A';

    return (
        <div className="p-4 sm:p-6 bg-base-100 rounded-box shadow max-w-7xl mx-auto border border-base-200">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3 lg:mb-6">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold">Listado de Procesos (Obras)</h1>
                    <p className="text-sm text-base-content/70">
                        Órdenes de trabajo y sus servicios (APUs) registrados.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center items-start gap-3 sm:gap-4 lg:flex-col lg:items-end lg:justify-start lg:gap-2 w-full lg:w-auto">
                    <Link to="/apus/nuevo" className="btn btn-primary btn-sm whitespace-nowrap w-48">
                        + Nuevo Proceso
                    </Link>
                    <QuickPowerButton
                        buttonClassName="w-48"
                        isOpen={activeQuickCreate === 'power'}
                        onOpenChange={(open) =>
                            setActiveQuickCreate((prev) =>
                                open ? 'power' : prev === 'power' ? null : prev
                            )
                        }
                    />
                    <QuickBrandButton
                        buttonClassName="w-48"
                        isOpen={activeQuickCreate === 'brand'}
                        onOpenChange={(open) =>
                            setActiveQuickCreate((prev) =>
                                open ? 'brand' : prev === 'brand' ? null : prev
                            )
                        }
                    />
                </div>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}

            {/* VISTA EN TARJETAS PARA PANTALLAS PEQUEÑAS / MEDIANAS (< lg) */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-base-content/70">Cargando procesos...</div>
                ) : processes.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">No hay procesos registrados.</div>
                ) : (
                    processes.map((proc) => {
                        const servicesCount = proc.services?.length || 0;
                        const totalProposed = getTotalProposed(proc);
                        const specSummary = buildSpecSummary(proc);

                        return (
                            <article
                                key={proc.serviceRequest}
                                className="p-4 rounded-box bg-base-200/40 border border-base-300 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-base break-all">
                                                {proc.serviceRequest}
                                            </span>
                                            <span className="badge badge-neutral badge-sm">
                                                {servicesCount} {servicesCount === 1 ? 'servicio' : 'servicios'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-base-content/80 mt-0.5 truncate">
                                            {proc.company?.name || proc.company?.id}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="block text-[11px] uppercase tracking-wide text-base-content/60">
                                            Total Propuesto
                                        </span>
                                        <span className="font-bold text-primary text-base whitespace-nowrap">
                                            ${totalProposed.toLocaleString('en-US')}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="font-medium text-sm leading-snug break-words">
                                        {proc.mainProcess}
                                    </p>
                                    <p className="text-xs text-base-content/70 break-words">
                                        <span className="font-semibold">Equipo:</span> {specSummary}
                                    </p>
                                </div>

                                <div className="pt-2.5 border-t border-base-300/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                    <div className="text-xs text-base-content/70 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
                                        <span>
                                            <span className="font-semibold">Creado:</span> {formatDateTime(proc.createdAt)}
                                        </span>
                                        <span>
                                            <span className="font-semibold">Act.:</span> {formatDateTime(proc.updatedAt)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                                        <Link
                                            to={`/apus/detalle?serviceRequest=${encodeURIComponent(proc.serviceRequest)}`}
                                            className="btn btn-xs btn-outline btn-info whitespace-nowrap w-20"
                                            title="Ver obra y servicios"
                                        >
                                            Ver Obra
                                        </Link>
                                        <Link
                                            to={`/apus/editar?serviceRequest=${encodeURIComponent(proc.serviceRequest)}`}
                                            className="btn btn-xs btn-outline btn-warning whitespace-nowrap w-20"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline btn-error whitespace-nowrap w-20"
                                            onClick={() => handleDelete(proc.serviceRequest)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {/* VISTA EN TABLA PARA ESCRITORIO (lg+) */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="table table-zebra table-sm w-full [&_th]:px-2.5 [&_td]:px-2.5">
                    <thead>
                    <tr>
                        <th className="whitespace-nowrap">Orden / Solicitud</th>
                        <th>Empresa</th>
                        <th>Proceso Principal</th>
                        <th title="Marca / Potencia / Tipo">Equipo</th>
                        <th className="text-center whitespace-nowrap">Servicios</th>
                        <th className="text-right whitespace-nowrap">Total</th>
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
                            const specSummary = buildSpecSummary(proc);

                            return (
                                <tr key={proc.serviceRequest}>
                                    <td className="font-semibold whitespace-nowrap">{proc.serviceRequest}</td>
                                    <td className="max-w-36 break-words">{proc.company?.name || proc.company?.id}</td>
                                    <td className="max-w-52 break-words">{proc.mainProcess}</td>
                                    <td className="text-xs xl:text-sm text-base-content/70 max-w-48 break-words">{specSummary}</td>
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
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                to={`/apus/detalle?serviceRequest=${encodeURIComponent(proc.serviceRequest)}`}
                                                className="btn btn-xs btn-outline btn-info whitespace-nowrap w-[4.5rem] px-1.5"
                                                title="Ver obra y servicios"
                                            >
                                                Ver Obra
                                            </Link>
                                            <Link
                                                to={`/apus/editar?serviceRequest=${encodeURIComponent(proc.serviceRequest)}`}
                                                className="btn btn-xs btn-outline btn-warning whitespace-nowrap w-[4.5rem] px-1.5"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline btn-error whitespace-nowrap w-[4.5rem] px-1.5"
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