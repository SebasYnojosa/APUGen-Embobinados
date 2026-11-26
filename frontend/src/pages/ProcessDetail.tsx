import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apuService } from '../services/apuServices';
import { formatMotorType } from '../utils/codificationUtils';
import { formatDateTime } from '../utils/dateUtils';
import type { ProcessResponseDTO } from '../types';

export default function ProcessDetail() {
    const [searchParams] = useSearchParams();
    const serviceRequest = searchParams.get('serviceRequest');
    const navigate = useNavigate();

    const [data, setData] = useState<ProcessResponseDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProcess = async () => {
        if (!serviceRequest) return;
        try {
            setLoading(true);
            const response = await apuService.getProcessByServiceRequest(serviceRequest);
            setData(response);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cargar los detalles del proceso.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcess();
    }, [serviceRequest]);

    const handleDeleteService = async (serviceId: string) => {
        if (!confirm(`¿Estás seguro de eliminar el servicio ${serviceId}?`)) return;
        try {
            await apuService.deleteService(serviceId);
            fetchProcess();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al eliminar el servicio.');
        }
    };

    const formatCurrency = (amount: number) =>
        `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-4xl mx-auto mt-8 alert alert-error shadow-lg">
                <span>{error || 'Proceso no encontrado'}</span>
                <button className="btn btn-sm" onClick={() => navigate('/apus')}>Volver al inicio</button>
            </div>
        );
    }

    const { process, services, servicesCount, totalCalculatedPrice, totalProposedPrice } = data;

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-5 sm:space-y-6">
            {/* ENCABEZADO DE LA OBRA */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 print:shadow-none print:border-none">
                <div className="min-w-0">
                    <div className="badge badge-primary mb-2 font-bold print:hidden">Obra / Proceso</div>
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">{process.serviceRequest}</h1>
                    <p className="text-base-content/70 text-base sm:text-lg break-words">
                        {process.mainProcess} - <span className="font-semibold text-base-content">{process.company?.name}</span>
                    </p>
                    <p className="text-xs text-base-content/60 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>Creada:</strong> {formatDateTime(process.createdAt)}</span>
                        <span><strong>Última actualización:</strong> {formatDateTime(process.updatedAt)}</span>
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 lg:grid lg:grid-cols-2 lg:gap-2 w-full lg:w-auto print:hidden shrink-0">
                    <button type="button" className="btn btn-outline btn-sm whitespace-nowrap w-48" onClick={() => navigate('/apus')}>Volver</button>
                    <button
                        type="button"
                        className="btn btn-warning btn-outline btn-sm whitespace-nowrap w-48"
                        onClick={() => navigate(`/apus/editar?serviceRequest=${encodeURIComponent(process.serviceRequest)}`)}
                    >
                        Editar Obra
                    </button>
                    <button type="button" className="btn btn-secondary btn-outline btn-sm whitespace-nowrap w-48" onClick={() => window.print()}>
                        🖨️ Imprimir Obra / PDF
                    </button>
                    <Link
                        to={`/apus/servicio/nuevo?serviceRequest=${encodeURIComponent(process.serviceRequest)}`}
                        className="btn btn-primary btn-sm whitespace-nowrap w-48"
                    >
                        + Agregar Servicio
                    </Link>
                </div>
            </div>

            {/* ESPECIFICACIONES DEL EQUIPO */}
            <div className="bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 print:shadow-none">
                <h3 className="text-lg font-bold mb-4 border-b border-base-300 pb-2">Especificaciones del Equipo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                    <div className="min-w-0">
                        <span className="font-semibold block text-base-content/60">Potencia</span>
                        <span className="break-words">{process.power || 'N/A'}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold block text-base-content/60">Tipo de Motor</span>
                        <span className="break-words">{formatMotorType(process.tipoM)}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold block text-base-content/60">Serial</span>
                        <span className="break-words">{process.serial || 'N/A'}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold block text-base-content/60">Marca</span>
                        <span className="break-words">{process.brand || 'N/A'}</span>
                    </div>
                    <div className="min-w-0 col-span-2 sm:col-span-1">
                        <span className="font-semibold block text-base-content/60">Ubicación</span>
                        <span className="break-words">{process.location || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* LISTADO DE SERVICIOS (APUs DE LA OBRA) */}
            <div className="bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 print:shadow-none print:p-0">
                <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 mb-4 border-b border-base-300 pb-2">
                    <h3 className="text-lg font-bold">
                        Servicios de la Obra ({servicesCount})
                    </h3>
                    <Link
                        to={`/apus/servicio/nuevo?serviceRequest=${encodeURIComponent(process.serviceRequest)}`}
                        className="btn btn-primary btn-sm whitespace-nowrap w-48 print:hidden"
                    >
                        + Nuevo Servicio
                    </Link>
                </div>

                {/* VISTA EN TARJETAS (< lg, oculta al imprimir) */}
                <div className="lg:hidden print:hidden space-y-3">
                    {services.length === 0 ? (
                        <div className="text-center py-8 text-sm text-base-content/60">
                            Esta obra aún no tiene servicios registrados. Haz clic en <strong>+ Agregar Servicio</strong> para crear el primero.
                        </div>
                    ) : (
                        services.map((srv) => (
                            <article
                                key={srv.id}
                                className="p-3.5 sm:p-4 rounded-box bg-base-200/40 border border-base-300 space-y-2.5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-mono text-xs font-bold badge badge-ghost h-auto py-1 break-all">
                                        {srv.id}
                                    </span>
                                    <div className="text-right shrink-0">
                                        <span className="block font-bold text-primary font-mono text-base whitespace-nowrap">
                                            ${srv.proposedUnitPrice?.toLocaleString('en-US')}
                                        </span>
                                        <span className="block text-[11px] text-base-content/60 font-mono whitespace-nowrap">
                                            Calc.: {formatCurrency(srv.calculatedUnitPrice)}
                                        </span>
                                    </div>
                                </div>

                                <p className="font-medium text-sm leading-snug break-words">
                                    {srv.description}
                                </p>

                                <div className="pt-2 border-t border-base-300/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="text-xs text-base-content/70 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
                                        <span><span className="font-semibold">Creado:</span> {formatDateTime(srv.createdAt)}</span>
                                        <span><span className="font-semibold">Act.:</span> {formatDateTime(srv.updatedAt)}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                                        <Link
                                            to={`/apus/servicio/detalle?serviceId=${encodeURIComponent(srv.id)}`}
                                            className="btn btn-xs btn-outline btn-info whitespace-nowrap w-20"
                                        >
                                            Detalle
                                        </Link>
                                        <Link
                                            to={`/apus/servicio/editar?serviceId=${encodeURIComponent(srv.id)}`}
                                            className="btn btn-xs btn-outline btn-warning whitespace-nowrap w-20"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline btn-error whitespace-nowrap w-20"
                                            onClick={() => handleDeleteService(srv.id)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>

                {/* VISTA EN TABLA (lg+ y siempre al imprimir) */}
                <div className="hidden lg:block print:block overflow-x-auto">
                    <table className="table table-zebra table-sm w-full [&_th]:px-2.5 [&_td]:px-2.5">
                        <thead>
                        <tr className="bg-base-200">
                            <th className="whitespace-nowrap">ID Servicio</th>
                            <th>Descripción del Servicio</th>
                            <th className="text-right whitespace-nowrap">Precio Calc.</th>
                            <th className="text-right whitespace-nowrap">Precio Propuesto</th>
                            <th className="whitespace-nowrap print:hidden">Fechas</th>
                            <th className="text-center whitespace-nowrap print:hidden">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-base-content/60">
                                    Esta obra aún no tiene servicios registrados. Haz clic en <strong>+ Agregar Servicio</strong> para crear el primero.
                                </td>
                            </tr>
                        ) : (
                            services.map((srv) => (
                                <tr key={srv.id}>
                                    <td className="font-mono text-xs font-bold whitespace-nowrap">{srv.id}</td>
                                    <td className="font-medium break-words">{srv.description}</td>
                                    <td className="text-right font-mono whitespace-nowrap">{formatCurrency(srv.calculatedUnitPrice)}</td>
                                    <td className="text-right font-bold text-primary font-mono whitespace-nowrap">
                                        ${srv.proposedUnitPrice?.toLocaleString('en-US')}
                                    </td>
                                    <td className="text-xs text-base-content/70 whitespace-nowrap tabular-nums leading-tight print:hidden">
                                        <div><span className="font-semibold">Creado:</span> {formatDateTime(srv.createdAt)}</div>
                                        <div><span className="font-semibold">Act.:</span> {formatDateTime(srv.updatedAt)}</div>
                                    </td>
                                    <td className="whitespace-nowrap print:hidden">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                to={`/apus/servicio/detalle?serviceId=${encodeURIComponent(srv.id)}`}
                                                className="btn btn-xs btn-outline btn-info whitespace-nowrap w-[4.5rem] px-1.5"
                                            >
                                                Detalle
                                            </Link>
                                            <Link
                                                to={`/apus/servicio/editar?serviceId=${encodeURIComponent(srv.id)}`}
                                                className="btn btn-xs btn-outline btn-warning whitespace-nowrap w-[4.5rem] px-1.5"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline btn-error whitespace-nowrap w-[4.5rem] px-1.5"
                                                onClick={() => handleDeleteService(srv.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RESUMEN FINANCIERO GENERAL DE LA OBRA */}
            <div className="stats stats-vertical md:stats-horizontal shadow w-full border border-base-200 print:shadow-none print:border-black">
                <div className="stat">
                    <div className="stat-title text-base-content/70">Total de Servicios</div>
                    <div className="stat-value text-xl sm:text-2xl font-mono">{servicesCount}</div>
                    <div className="stat-desc">Partidas / APUs en la obra</div>
                </div>
                <div className="stat">
                    <div className="stat-title text-base-content/70">Total Calculado Real</div>
                    <div className="stat-value text-xl sm:text-2xl font-mono">{formatCurrency(totalCalculatedPrice)}</div>
                    <div className="stat-desc">Suma exacta sin redondeo</div>
                </div>
                <div className="stat bg-primary text-primary-content print:bg-transparent print:text-black">
                    <div className="stat-title text-primary-content/80 print:text-black font-bold">Total Propuesto de la Obra</div>
                    <div className="stat-value text-2xl sm:text-3xl">${totalProposedPrice.toLocaleString('en-US')}</div>
                    <div className="stat-desc text-primary-content/80 print:text-black">Suma de precios propuestos</div>
                </div>
            </div>
        </div>
    );
}
