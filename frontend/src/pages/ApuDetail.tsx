import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apuService } from '../services/apuServices';
import type { ApuResponseDTO } from '../types';

export default function ApuDetail() {
    const [searchParams] = useSearchParams();
    const serviceRequest = searchParams.get('serviceRequest');
    const navigate = useNavigate();

    const [data, setData] = useState<ApuResponseDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApu = async () => {
            try {
                setLoading(true);
                if (serviceRequest) {
                    const response = await apuService.getApuByServiceRequest(serviceRequest);
                    setData(response);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Error al cargar los detalles del APU.');
            } finally {
                setLoading(false);
            }
        };
        fetchApu();
    }, [serviceRequest]);

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
                <span>{error || 'APU no encontrado'}</span>
                <button className="btn btn-sm" onClick={() => navigate('/apus')}>Volver al inicio</button>
            </div>
        );
    }

    const {
        process,
        materials,
        equipments,
        labors,
        totalMaterials,
        totalEquipmentsDaily,
        totalLaborsBase,
        socialLawsCost,
        totalLaborsDaily
    } = data;

    // Funciones auxiliares para formato visual
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatPercent = (dec: number) => `${(dec * 100).toFixed(0)}%`;

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            {/* ENCABEZADO Y ACCIONES */}
            <div className="flex justify-between items-center bg-base-100 p-6 rounded-box shadow border border-base-200 print:shadow-none print:border-none">
                <div>
                    <div className="badge badge-primary mb-2 font-bold print:hidden">APU Válido</div>
                    <h1 className="text-3xl font-bold">{process.serviceRequest}</h1>
                    <p className="text-base-content/70 text-lg">{process.mainProcess} - <span className="font-semibold text-base-content">{process.company?.name}</span></p>
                </div>
                <div className="space-x-2 print:hidden">
                    <button className="btn btn-outline" onClick={() => navigate('/apus')}>Volver</button>
                    <button
                        className="btn btn-warning btn-outline"
                        onClick={() => navigate(`/apus/editar?serviceRequest=${encodeURIComponent(process.serviceRequest)}`)}
                    >
                        Editar
                    </button>
                    <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
                </div>
            </div>

            {/* ESPECIFICACIONES Y VARIABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-base-100 p-6 rounded-box shadow border border-base-200 print:shadow-none">
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">Especificaciones del Equipo</h3>
                    <ul className="space-y-2 text-sm">
                        <li><span className="font-semibold inline-block w-24">Descripción:</span> {process.description}</li>
                        <li><span className="font-semibold inline-block w-24">Potencia:</span> {process.power || 'N/A'}</li>
                        <li><span className="font-semibold inline-block w-24">Serial:</span> {process.serial || 'N/A'}</li>
                        <li><span className="font-semibold inline-block w-24">Marca:</span> {process.brand || 'N/A'}</li>
                        <li><span className="font-semibold inline-block w-24">Ubicación:</span> {process.location || 'N/A'}</li>
                    </ul>
                </div>
                <div className="bg-base-100 p-6 rounded-box shadow border border-base-200 print:shadow-none">
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">Variables de Cálculo</h3>
                    <ul className="space-y-2 text-sm">
                        <li><span className="font-semibold inline-block w-40">Cantidad del Ítem:</span> {process.itemQuantity}</li>
                        <li><span className="font-semibold inline-block w-40 text-primary">Rendimiento:</span> <span className="font-bold text-primary">{process.performance}</span></li>
                        <li><span className="font-semibold inline-block w-40">Leyes Sociales:</span> {formatPercent(process.socialLawsPercentage)}</li>
                        <li><span className="font-semibold inline-block w-40">Administración:</span> {formatPercent(process.adminPercentage)}</li>
                        <li><span className="font-semibold inline-block w-40">Utilidad e Imprev.:</span> {formatPercent(process.utilityContingencyPercentage)}</li>
                    </ul>
                </div>
            </div>

            {/* TABLAS DE DESGLOSE */}
            <div className="bg-base-100 p-6 rounded-box shadow border border-base-200 space-y-8 print:shadow-none print:p-0">

                {/* MATERIALES */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center justify-between border-b pb-2">
                        <span><span className="print:hidden">🔧</span> Materiales</span>
                        <span className="text-sm font-normal text-base-content/70">
                            Costo Unitario: <strong className="text-primary font-mono text-base">{formatCurrency(process.materialUnitCost)}</strong>
                        </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                            <tr className="bg-base-200">
                                <th>ID</th><th>Descripción</th><th>Unidad</th><th>Costo Aplicado</th><th>Cantidad</th><th className="text-right">Subtotal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {materials.length === 0 ? <tr><td colSpan={6} className="text-center text-base-content/50">Sin materiales</td></tr> :
                                materials.map((m) => (
                                    <tr key={m.id}>
                                        <td className="font-mono text-xs">{m.material.id}</td>
                                        <td>{m.descriptionSnapshot}</td>
                                        <td>{m.unitSnapshot}</td>
                                        <td>{formatCurrency(m.costApplied)}</td>
                                        <td>{m.quantity}</td>
                                        <td className="text-right font-semibold">{formatCurrency(m.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/60 font-semibold text-base-content">
                            <tr>
                                <td colSpan={5} className="text-right">Total Materiales:</td>
                                <td className="text-right font-mono">{formatCurrency(totalMaterials)}</td>
                            </tr>
                            <tr className="text-primary">
                                <td colSpan={5} className="text-right">Costo Unitario Materiales (Total × Cant. Ítem {process.itemQuantity}):</td>
                                <td className="text-right font-mono">{formatCurrency(process.materialUnitCost)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* EQUIPOS */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center justify-between border-b pb-2">
                        <span><span className="print:hidden">⚙️</span> Equipos</span>
                        <span className="text-sm font-normal text-base-content/70">
                            Costo Unitario: <strong className="text-primary font-mono text-base">{formatCurrency(process.equipmentUnitCost)}</strong>
                        </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                            <tr className="bg-base-200">
                                <th>ID</th><th>Descripción</th><th>Valor Base</th><th>Depreciación</th><th>Cantidad</th><th className="text-right">Costo Uso Diario</th>
                            </tr>
                            </thead>
                            <tbody>
                            {equipments.length === 0 ? <tr><td colSpan={6} className="text-center text-base-content/50">Sin equipos</td></tr> :
                                equipments.map((e) => (
                                    <tr key={e.id}>
                                        <td className="font-mono text-xs">{e.equipment.id}</td>
                                        <td>{e.descriptionSnapshot}</td>
                                        <td>{formatCurrency(e.valueApplied)}</td>
                                        <td className="font-mono">{e.depreciationFactorApplied}</td>
                                        <td>{e.quantity}</td>
                                        <td className="text-right font-semibold">{formatCurrency(e.dailyUseCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/60 font-semibold text-base-content">
                            <tr>
                                <td colSpan={5} className="text-right">Total Uso Diario Equipos:</td>
                                <td className="text-right font-mono">{formatCurrency(totalEquipmentsDaily)}</td>
                            </tr>
                            <tr className="text-primary">
                                <td colSpan={5} className="text-right">Costo Unitario Equipos (Total Diario ÷ Rendimiento {process.performance}):</td>
                                <td className="text-right font-mono">{formatCurrency(process.equipmentUnitCost)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* MANO DE OBRA */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center justify-between border-b pb-2">
                        <span><span className="print:hidden">👷</span> Mano de Obra</span>
                        <span className="text-sm font-normal text-base-content/70">
                            Costo Unitario: <strong className="text-primary font-mono text-base">{formatCurrency(process.laborUnitCost)}</strong>
                        </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                            <tr className="bg-base-200">
                                <th>ID</th><th>Cargo</th><th>Salario Aplicado</th><th>Dotación</th><th className="text-right">Costo Diario</th>
                            </tr>
                            </thead>
                            <tbody>
                            {labors.length === 0 ? <tr><td colSpan={5} className="text-center text-base-content/50">Sin mano de obra</td></tr> :
                                labors.map((l) => (
                                    <tr key={l.id}>
                                        <td className="font-mono text-xs">{l.labor.id}</td>
                                        <td>{l.descriptionSnapshot}</td>
                                        <td>{formatCurrency(l.dailyWageApplied)}</td>
                                        <td>{l.dotation}</td>
                                        <td className="text-right font-semibold">{formatCurrency(l.dailyCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/60 font-semibold text-base-content">
                            <tr>
                                <td colSpan={4} className="text-right">Subtotal Mano de Obra (Diario):</td>
                                <td className="text-right font-mono">{formatCurrency(totalLaborsBase)}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="text-right">Leyes Sociales ({formatPercent(process.socialLawsPercentage)}):</td>
                                <td className="text-right font-mono">{formatCurrency(socialLawsCost)}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="text-right">Total Diario Personal:</td>
                                <td className="text-right font-mono">{formatCurrency(totalLaborsDaily)}</td>
                            </tr>
                            <tr className="text-primary">
                                <td colSpan={4} className="text-right">Costo Unitario Mano de Obra (Total Diario ÷ Rendimiento {process.performance}):</td>
                                <td className="text-right font-mono">{formatCurrency(process.laborUnitCost)}</td>
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
                    <div className="stat-value text-xl font-mono">{formatCurrency(process.directUnitCost)}</div>
                    <div className="stat-desc">Suma de Mat + Eq + MO</div>
                </div>
                <div className="stat">
                    <div className="stat-title text-base-content/70">Administración ({formatPercent(process.adminPercentage)})</div>
                    <div className="stat-value text-xl font-mono">{formatCurrency(process.adminCostValue)}</div>
                    <div className="stat-desc">Sobre el Costo Directo</div>
                </div>
                <div className="stat">
                    <div className="stat-title text-base-content/70">Utilidad e Imp. ({formatPercent(process.utilityContingencyPercentage)})</div>
                    <div className="stat-value text-xl font-mono">{formatCurrency(process.utilityCostValue)}</div>
                    <div className="stat-desc">Sobre Costo + Admin</div>
                </div>
                <div className="stat bg-primary text-primary-content print:bg-transparent print:text-black">
                    <div className="stat-title text-primary-content/80 print:text-black font-bold">Precio Unitario Propuesto</div>
                    <div className="stat-value text-3xl">${process.proposedUnitPrice.toLocaleString('en-US')}</div>
                    <div className="stat-desc text-primary-content/80 print:text-black">Calculado real: {formatCurrency(process.calculatedUnitPrice)}</div>
                </div>
            </div>
        </div>
    );
}