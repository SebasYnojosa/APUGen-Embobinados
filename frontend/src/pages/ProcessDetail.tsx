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
        <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* ENCABEZADO DE LA OBRA */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-base-100 p-6 rounded-box shadow border border-base-200 print:shadow-none print:border-none">
                <div>
                    <div className="badge badge-primary mb-2 font-bold print:hidden">Obra / Proceso</div>
                    <h1 className="text-3xl font-bold">{process.serviceRequest}</h1>
                    <p className="text-base-content/70 text-lg">
                        {process.mainProcess} - <span className="font-semibold text-base-content">{process.company?.name}</span>
                    </p>
                    <p className="text-xs text-base-content/60 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>Creada:</strong> {formatDateTime(process.createdAt)}</span>
                        <span><strong>Última actualización:</strong> {formatDateTime(process.updatedAt)}</span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/apus')}>Volver</button>
                    <button
                        className="btn btn-warning btn-outline btn-sm"
                        onClick={() => navigate(`/apus/editar?serviceRequest=${encodeURIComponent(process.serviceRequest)}`)}
                    >
                        Editar Obra
                    </button>
                    <button className="btn btn-secondary btn-outline btn-sm" onClick={() => window.print()}>
                        🖨️ Imprimir Obra / PDF
                    </button>
                    <Link
                        to={`/apus/servicio/nuevo?serviceRequest=${encodeURIComponent(process.serviceRequest)}`}
                        className="btn btn-primary btn-sm"
                    >
                        + Agregar Servicio
                    </Link>
                </div>
            </div>

            {/* ESPECIFICACIONES DEL EQUIPO */}
            <div className="bg-base-100 p-6 rounded-box shadow border border-base-200 print:shadow-none">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">Especificaciones del Equipo</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                        <span className="font-semibold block text-base-content/60">Potencia</span>
                        <span>{process.power || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-base-content/60">Tipo de Motor</span>
                        <span>{formatMotorType(process.tipoM)}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-base-content/60">Serial</span>
                        <span>{process.serial || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-base-content/60">Marca</span>
                        <span>{process.brand || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-base-content/60">Ubicación</span>
                        <span>{process.location || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* LISTADO DE SERVICIOS (APUs DE LA OBRA) */}
            <div className="bg-base-100 p-6 rounded-box shadow border border-base-200 print:shadow-none print:p-0">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-bold">
                        Servicios de la Obra ({servicesCount})
                    </h3>
                    <Link
                        to={`/apus/servicio/nuevo?serviceRequest=${encodeURIComponent(process.serviceRequest)}`}
                        className="btn btn-primary btn-xs print:hidden"
                    >
                        + Nuevo Servicio
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
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
                                    <td className="font-medium">{srv.description}</td>
                                    <td className="text-right font-mono whitespace-nowrap">{formatCurrency(srv.calculatedUnitPrice)}</td>
                                    <td className="text-right font-bold text-primary font-mono whitespace-nowrap">
                                        ${srv.proposedUnitPrice?.toLocaleString('en-US')}
                                    </td>
                                    <td className="text-xs text-base-content/70 whitespace-nowrap tabular-nums leading-tight print:hidden">
                                        <div><span className="font-semibold">Creado:</span> {formatDateTime(srv.createdAt)}</div>
                                        <div><span className="font-semibold">Act.:</span> {formatDateTime(srv.updatedAt)}</div>
                                    </td>
                                    <td className="whitespace-nowrap print:hidden">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Link
                                                to={`/apus/servicio/detalle?serviceId=${encodeURIComponent(srv.id)}`}
                                                className="btn btn-xs btn-outline btn-info whitespace-nowrap"
                                            >
                                                Detalle
                                            </Link>
                                            <Link
                                                to={`/apus/servicio/editar?serviceId=${encodeURIComponent(srv.id)}`}
                                                className="btn btn-xs btn-outline btn-warning whitespace-nowrap"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                className="btn btn-xs btn-outline btn-error whitespace-nowrap"
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
            <div className="stats stats-vertical lg:stats-horizontal shadow w-full border border-base-200 print:shadow-none print:border-black">
                <div className="stat">
                    <div className="stat-title text-base-content/70">Total de Servicios</div>
                    <div className="stat-value text-2xl font-mono">{servicesCount}</div>
                    <div className="stat-desc">Partidas / APUs en la obra</div>
                </div>
                <div className="stat">
                    <div className="stat-title text-base-content/70">Total Calculado Real</div>
                    <div className="stat-value text-2xl font-mono">{formatCurrency(totalCalculatedPrice)}</div>
                    <div className="stat-desc">Suma exacta sin redondeo</div>
                </div>
                <div className="stat bg-primary text-primary-content print:bg-transparent print:text-black">
                    <div className="stat-title text-primary-content/80 print:text-black font-bold">Total Propuesto de la Obra</div>
                    <div className="stat-value text-3xl">${totalProposedPrice.toLocaleString('en-US')}</div>
                    <div className="stat-desc text-primary-content/80 print:text-black">Suma de precios propuestos</div>
                </div>
            </div>
        </div>
    );
}
