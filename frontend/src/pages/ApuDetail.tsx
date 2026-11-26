import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apuService } from '../services/apuServices';
import { formatMotorType } from '../utils/codificationUtils';
import { formatDateTime } from '../utils/dateUtils';
import type { ServiceResponseDTO } from '../types';

export default function ApuDetail() {
    const [searchParams] = useSearchParams();
    const serviceId = searchParams.get('serviceId');
    const navigate = useNavigate();

    const [data, setData] = useState<ServiceResponseDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                if (serviceId) {
                    const response = await apuService.getServiceById(serviceId);
                    setData(response);
                } else {
                    setError('No se especificó el ID del servicio.');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Error al cargar los detalles del servicio.');
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [serviceId]);

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
                <span>{error || 'Servicio no encontrado'}</span>
                <button className="btn btn-sm" onClick={() => navigate('/apus')}>Volver al inicio</button>
            </div>
        );
    }

    const {
        process,
        service,
        materials,
        equipments,
        labors,
        totalMaterials,
        totalEquipmentsDaily,
        totalLaborsBase,
        socialLawsCost,
        totalLaborsDaily,
    } = data;

    const formatCurrency = (amount: number) =>
        `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatPercent = (dec: number) => `${((dec || 0) * 100).toFixed(0)}%`;

    return (
        <div className="max-w-6xl mx-auto p-3 sm:p-4 space-y-5 sm:space-y-6">
            {/* ENCABEZADO Y ACCIONES */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 print:shadow-none print:border-none">
                <div className="min-w-0">
                    <div className="badge badge-primary mb-2 font-bold print:hidden">APU Servicio</div>
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">{service.id}</h1>
                    <p className="text-base sm:text-lg font-semibold mt-1 break-words">{service.description}</p>
                    <p className="text-base-content/70 text-sm break-words">
                        Obra: <span className="font-semibold text-base-content">{process.serviceRequest}</span> — {process.mainProcess} (<span className="font-semibold text-base-content">{process.company?.name}</span>)
                    </p>
                    <p className="text-xs text-base-content/60 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>Creado:</strong> {formatDateTime(service.createdAt)}</span>
                        <span><strong>Última actualización:</strong> {formatDateTime(service.updatedAt)}</span>
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 lg:flex-col lg:items-end lg:justify-start lg:gap-2 w-full lg:w-auto print:hidden shrink-0">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm whitespace-nowrap w-48"
                        onClick={() => navigate(`/apus/detalle?serviceRequest=${encodeURIComponent(process.serviceRequest)}`)}
                    >
                        Volver a la Obra
                    </button>
                    <button
                        type="button"
                        className="btn btn-warning btn-outline btn-sm whitespace-nowrap w-48"
                        onClick={() => navigate(`/apus/servicio/editar?serviceId=${encodeURIComponent(service.id)}`)}
                    >
                        Editar Servicio
                    </button>
                    <button type="button" className="btn btn-primary btn-sm whitespace-nowrap w-48" onClick={() => window.print()}>
                        🖨️ Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* ESPECIFICACIONES Y VARIABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 print:shadow-none">
                    <h3 className="text-lg font-bold mb-4 border-b border-base-300 pb-2">Especificaciones del Equipo</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-32 shrink-0">Obra:</span>
                            <span className="break-words">{process.serviceRequest}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-32 shrink-0">Potencia:</span>
                            <span className="break-words">{process.power || 'N/A'}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-32 shrink-0">Tipo de Motor:</span>
                            <span className="break-words">{formatMotorType(process.tipoM)}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-32 shrink-0">Serial:</span>
                            <span className="break-words">{process.serial || 'N/A'}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-32 shrink-0">Marca:</span>
                            <span className="break-words">{process.brand || 'N/A'}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-32 shrink-0">Ubicación:</span>
                            <span className="break-words">{process.location || 'N/A'}</span>
                        </li>
                    </ul>
                </div>
                <div className="bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 print:shadow-none">
                    <h3 className="text-lg font-bold mb-4 border-b border-base-300 pb-2">Variables de Cálculo del Servicio</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-44 shrink-0">Cantidad del Ítem:</span>
                            <span>{service.itemQuantity}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-primary sm:w-44 shrink-0">Rendimiento:</span>
                            <span className="font-bold text-primary">{service.performance}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-44 shrink-0">Leyes Sociales:</span>
                            <span>{formatPercent(service.socialLawsPercentage)}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-44 shrink-0">Administración:</span>
                            <span>{formatPercent(service.adminPercentage)}</span>
                        </li>
                        <li className="flex flex-wrap justify-between sm:justify-start gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-base-content/70 sm:w-44 shrink-0">Utilidad e Imprev.:</span>
                            <span>{formatPercent(service.utilityContingencyPercentage)}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* TABLAS DE DESGLOSE */}
            <div className="bg-base-100 p-4 sm:p-6 rounded-box shadow border border-base-200 space-y-6 sm:space-y-8 print:shadow-none print:p-0">

                {/* MATERIALES */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-2">
                        <span><span className="print:hidden">🔧</span> Materiales</span>
                        <span className="text-sm font-normal text-base-content/70">
                            Costo Unitario: <strong className="text-primary font-mono text-base">{formatCurrency(service.materialUnitCost)}</strong>
                        </span>
                    </h3>

                    {/* Tarjetas móvil (< md, oculto al imprimir) */}
                    <div className="md:hidden print:hidden space-y-2.5">
                        {materials.length === 0 ? (
                            <p className="text-center text-sm text-base-content/50 py-3">Sin materiales</p>
                        ) : (
                            materials.map((m) => (
                                <div key={m.id} className="p-3 rounded-lg bg-base-200/40 border border-base-300 text-sm space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold text-base-content/70">{m.material.id}</span>
                                        <span className="font-bold font-mono whitespace-nowrap">{formatCurrency(m.amount)}</span>
                                    </div>
                                    <p className="font-medium leading-snug break-words">{m.descriptionSnapshot}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-base-content/70">
                                        <span><strong>Unidad:</strong> {m.unitSnapshot}</span>
                                        <span><strong>Costo:</strong> {formatCurrency(m.costApplied)}</span>
                                        <span><strong>Cant.:</strong> {m.quantity}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="p-3 rounded-lg bg-base-200/60 text-xs sm:text-sm space-y-1">
                            <div className="flex justify-between gap-2 font-semibold">
                                <span>Total Materiales:</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(totalMaterials)}</span>
                            </div>
                            <div className="flex justify-between gap-2 font-semibold text-primary">
                                <span>Costo Unitario (× Cant. {service.itemQuantity}):</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(service.materialUnitCost)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla escritorio y print */}
                    <div className="hidden md:block print:block overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                            <tr className="bg-base-200">
                                <th className="whitespace-nowrap">ID</th>
                                <th>Descripción</th>
                                <th className="whitespace-nowrap">Unidad</th>
                                <th className="whitespace-nowrap">Costo Aplicado</th>
                                <th className="whitespace-nowrap">Cantidad</th>
                                <th className="text-right whitespace-nowrap">Subtotal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {materials.length === 0 ? <tr><td colSpan={6} className="text-center text-base-content/50">Sin materiales</td></tr> :
                                materials.map((m) => (
                                    <tr key={m.id}>
                                        <td className="font-mono text-xs whitespace-nowrap">{m.material.id}</td>
                                        <td>{m.descriptionSnapshot}</td>
                                        <td className="whitespace-nowrap">{m.unitSnapshot}</td>
                                        <td className="whitespace-nowrap">{formatCurrency(m.costApplied)}</td>
                                        <td className="whitespace-nowrap">{m.quantity}</td>
                                        <td className="text-right font-semibold whitespace-nowrap">{formatCurrency(m.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/60 font-semibold text-base-content">
                            <tr>
                                <td colSpan={5} className="text-right">Total Materiales:</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(totalMaterials)}</td>
                            </tr>
                            <tr className="text-primary">
                                <td colSpan={5} className="text-right">Costo Unitario Materiales (Total × Cant. Ítem {service.itemQuantity}):</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(service.materialUnitCost)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* EQUIPOS */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-2">
                        <span><span className="print:hidden">⚙️</span> Equipos</span>
                        <span className="text-sm font-normal text-base-content/70">
                            Costo Unitario: <strong className="text-primary font-mono text-base">{formatCurrency(service.equipmentUnitCost)}</strong>
                        </span>
                    </h3>

                    {/* Tarjetas móvil (< md, oculto al imprimir) */}
                    <div className="md:hidden print:hidden space-y-2.5">
                        {equipments.length === 0 ? (
                            <p className="text-center text-sm text-base-content/50 py-3">Sin equipos</p>
                        ) : (
                            equipments.map((e) => (
                                <div key={e.id} className="p-3 rounded-lg bg-base-200/40 border border-base-300 text-sm space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold text-base-content/70">{e.equipment.id}</span>
                                        <span className="font-bold font-mono whitespace-nowrap">{formatCurrency(e.dailyUseCost)}</span>
                                    </div>
                                    <p className="font-medium leading-snug break-words">{e.descriptionSnapshot}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-base-content/70">
                                        <span><strong>Valor Base:</strong> {formatCurrency(e.valueApplied)}</span>
                                        <span><strong>Deprec.:</strong> <span className="font-mono">{e.depreciationFactorApplied}</span></span>
                                        <span><strong>Cant.:</strong> {e.quantity}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="p-3 rounded-lg bg-base-200/60 text-xs sm:text-sm space-y-1">
                            <div className="flex justify-between gap-2 font-semibold">
                                <span>Total Uso Diario Equipos:</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(totalEquipmentsDaily)}</span>
                            </div>
                            <div className="flex justify-between gap-2 font-semibold text-primary">
                                <span>Costo Unitario (÷ Rend. {service.performance}):</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(service.equipmentUnitCost)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla escritorio y print */}
                    <div className="hidden md:block print:block overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                            <tr className="bg-base-200">
                                <th className="whitespace-nowrap">ID</th>
                                <th>Descripción</th>
                                <th className="whitespace-nowrap">Valor Base</th>
                                <th className="whitespace-nowrap">Depreciación</th>
                                <th className="whitespace-nowrap">Cantidad</th>
                                <th className="text-right whitespace-nowrap">Costo Uso Diario</th>
                            </tr>
                            </thead>
                            <tbody>
                            {equipments.length === 0 ? <tr><td colSpan={6} className="text-center text-base-content/50">Sin equipos</td></tr> :
                                equipments.map((e) => (
                                    <tr key={e.id}>
                                        <td className="font-mono text-xs whitespace-nowrap">{e.equipment.id}</td>
                                        <td>{e.descriptionSnapshot}</td>
                                        <td className="whitespace-nowrap">{formatCurrency(e.valueApplied)}</td>
                                        <td className="font-mono whitespace-nowrap">{e.depreciationFactorApplied}</td>
                                        <td className="whitespace-nowrap">{e.quantity}</td>
                                        <td className="text-right font-semibold whitespace-nowrap">{formatCurrency(e.dailyUseCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/60 font-semibold text-base-content">
                            <tr>
                                <td colSpan={5} className="text-right">Total Uso Diario Equipos:</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(totalEquipmentsDaily)}</td>
                            </tr>
                            <tr className="text-primary">
                                <td colSpan={5} className="text-right">Costo Unitario Equipos (Total Diario ÷ Rendimiento {service.performance}):</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(service.equipmentUnitCost)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* MANO DE OBRA */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-2">
                        <span><span className="print:hidden">👷</span> Mano de Obra</span>
                        <span className="text-sm font-normal text-base-content/70">
                            Costo Unitario: <strong className="text-primary font-mono text-base">{formatCurrency(service.laborUnitCost)}</strong>
                        </span>
                    </h3>

                    {/* Tarjetas móvil (< md, oculto al imprimir) */}
                    <div className="md:hidden print:hidden space-y-2.5">
                        {labors.length === 0 ? (
                            <p className="text-center text-sm text-base-content/50 py-3">Sin mano de obra</p>
                        ) : (
                            labors.map((l) => (
                                <div key={l.id} className="p-3 rounded-lg bg-base-200/40 border border-base-300 text-sm space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold text-base-content/70">{l.labor.id}</span>
                                        <span className="font-bold font-mono whitespace-nowrap">{formatCurrency(l.dailyCost)}</span>
                                    </div>
                                    <p className="font-medium leading-snug break-words">{l.descriptionSnapshot}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-base-content/70">
                                        <span><strong>Salario:</strong> {formatCurrency(l.dailyWageApplied)}</span>
                                        <span><strong>Dotación:</strong> {l.dotation}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="p-3 rounded-lg bg-base-200/60 text-xs sm:text-sm space-y-1">
                            <div className="flex justify-between gap-2 font-semibold">
                                <span>Subtotal Mano de Obra (Diario):</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(totalLaborsBase)}</span>
                            </div>
                            <div className="flex justify-between gap-2 font-semibold">
                                <span>Leyes Sociales ({formatPercent(service.socialLawsPercentage)}):</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(socialLawsCost)}</span>
                            </div>
                            <div className="flex justify-between gap-2 font-semibold">
                                <span>Total Diario Personal:</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(totalLaborsDaily)}</span>
                            </div>
                            <div className="flex justify-between gap-2 font-semibold text-primary">
                                <span>Costo Unitario (÷ Rend. {service.performance}):</span>
                                <span className="font-mono whitespace-nowrap">{formatCurrency(service.laborUnitCost)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla escritorio y print */}
                    <div className="hidden md:block print:block overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                            <tr className="bg-base-200">
                                <th className="whitespace-nowrap">ID</th>
                                <th>Cargo</th>
                                <th className="whitespace-nowrap">Salario Aplicado</th>
                                <th className="whitespace-nowrap">Dotación</th>
                                <th className="text-right whitespace-nowrap">Costo Diario</th>
                            </tr>
                            </thead>
                            <tbody>
                            {labors.length === 0 ? <tr><td colSpan={5} className="text-center text-base-content/50">Sin mano de obra</td></tr> :
                                labors.map((l) => (
                                    <tr key={l.id}>
                                        <td className="font-mono text-xs whitespace-nowrap">{l.labor.id}</td>
                                        <td>{l.descriptionSnapshot}</td>
                                        <td className="whitespace-nowrap">{formatCurrency(l.dailyWageApplied)}</td>
                                        <td className="whitespace-nowrap">{l.dotation}</td>
                                        <td className="text-right font-semibold whitespace-nowrap">{formatCurrency(l.dailyCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/60 font-semibold text-base-content">
                            <tr>
                                <td colSpan={4} className="text-right">Subtotal Mano de Obra (Diario):</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(totalLaborsBase)}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="text-right">Leyes Sociales ({formatPercent(service.socialLawsPercentage)}):</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(socialLawsCost)}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="text-right">Total Diario Personal:</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(totalLaborsDaily)}</td>
                            </tr>
                            <tr className="text-primary">
                                <td colSpan={4} className="text-right">Costo Unitario Mano de Obra (Total Diario ÷ Rendimiento {service.performance}):</td>
                                <td className="text-right font-mono whitespace-nowrap">{formatCurrency(service.laborUnitCost)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* RESUMEN FINANCIERO (DAISYUI STATS) */}
            <div className="stats stats-vertical lg:stats-horizontal shadow w-full border border-base-200 print:shadow-none print:border-black">
                <div className="stat">
                    <div className="stat-title text-base-content/70">Costo Directo Unitario</div>
                    <div className="stat-value text-lg sm:text-xl font-mono">{formatCurrency(service.directUnitCost)}</div>
                    <div className="stat-desc">Suma de Mat + Eq + MO</div>
                </div>
                <div className="stat">
                    <div className="stat-title text-base-content/70">Administración ({formatPercent(service.adminPercentage)})</div>
                    <div className="stat-value text-lg sm:text-xl font-mono">{formatCurrency(service.adminCostValue)}</div>
                    <div className="stat-desc">Sobre el Costo Directo</div>
                </div>
                <div className="stat">
                    <div className="stat-title text-base-content/70">Utilidad e Imp. ({formatPercent(service.utilityContingencyPercentage)})</div>
                    <div className="stat-value text-lg sm:text-xl font-mono">{formatCurrency(service.utilityCostValue)}</div>
                    <div className="stat-desc">Sobre Costo + Admin</div>
                </div>
                <div className="stat bg-primary text-primary-content print:bg-transparent print:text-black">
                    <div className="stat-title text-primary-content/80 print:text-black font-bold">Precio Unitario Propuesto</div>
                    <div className="stat-value text-2xl sm:text-3xl">${service.proposedUnitPrice.toLocaleString('en-US')}</div>
                    <div className="stat-desc text-primary-content/80 print:text-black">Calculado real: {formatCurrency(service.calculatedUnitPrice)}</div>
                </div>
            </div>
        </div>
    );
}