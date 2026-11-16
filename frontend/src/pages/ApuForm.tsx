import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService } from '../services/catalogServices';
import type { Material, Equipment, Labor, Company } from '../types';

export default function ApuForm() {
    const navigate = useNavigate();

    // --- ESTADOS DE LOS CATÁLOGOS EN MEMORIA ---
    const [catalogCompanies, setCatalogCompanies] = useState<Company[]>([]);
    const [catalogMaterials, setCatalogMaterials] = useState<Material[]>([]);
    const [catalogEquipments, setCatalogEquipments] = useState<Equipment[]>([]);
    const [catalogLabors, setCatalogLabors] = useState<Labor[]>([]);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [comps, mats, eqs, labs] = await Promise.all([
                    catalogService.getCompanies(),
                    catalogService.getMaterials(),
                    catalogService.getEquipments(),
                    catalogService.getLabors()
                ]);
                setCatalogCompanies(comps);
                setCatalogMaterials(mats);
                setCatalogEquipments(eqs);
                setCatalogLabors(labs);
            } catch (error) {
                console.error("Error cargando catálogos para autocompletado:", error);
            }
        };
        fetchCatalogs();
    }, []);

    const [header, setHeader] = useState({
        serviceRequest: '', companyId: '', companyName: '', mainProcess: '', description: '',
        power: '', serial: '', brand: '', location: '',
        itemQuantity: 1, performance: 1, socialLawsPercentage: 0.75,
        adminPercentage: 0.15, utilityContingencyPercentage: 0.10
    });

    const [materials, setMaterials] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [labors, setLabors] = useState<any[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHeader(prev => ({ ...prev, [name]: value }));
    };

    // ==========================================
    // LÓGICA DE NAVEGACIÓN POR TECLADO (FOCUS)
    // ==========================================
    const focusElement = (id: string) => {
        setTimeout(() => document.getElementById(id)?.focus(), 50);
    };

    // Función genérica para saltar con Enter en campos simples
    const handleEnterFocus = (e: React.KeyboardEvent<HTMLInputElement>, nextId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusElement(nextId);
        }
    };

    // ==========================================
    // AUTOCOMPLETADO EMPRESA
    // ==========================================
    const handleCompanyAutoFill = (idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogCompanies.find(c => c.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            setHeader(prev => ({ ...prev, companyId: found.id, companyName: found.name }));
        } else {
            alert(`Empresa con ID "${idToSearch}" no encontrada.`);
            setHeader(prev => ({ ...prev, companyName: '' }));
        }
    };

    const handleCompanyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCompanyAutoFill(e.currentTarget.value);
            focusElement('input-description');
        }
    };

    // ==========================================
    // LÓGICA DE LISTAS Y AUTOCOMPLETADO (DETALLES)
    // ==========================================
    const addMaterial = () => {
        setMaterials([...materials, { materialId: '', description: '', unit: '', price: '', quantity: '' }]);
        focusElement(`input-material-id-${materials.length}`);
    };
    const removeMaterial = (index: number) => setMaterials(materials.filter((_, i) => i !== index));
    const updateMaterial = (index: number, field: string, value: string | number) => {
        const newMaterials = [...materials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setMaterials(newMaterials);
    };
    const handleMaterialAutoFill = (index: number, idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogMaterials.find(m => m.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            const newMaterials = [...materials];
            newMaterials[index] = {
                ...newMaterials[index], materialId: found.id, description: found.description,
                unit: found.unit, price: found.baseCost
            };
            setMaterials(newMaterials);
        } else {
            alert(`Material con ID "${idToSearch}" no encontrado.`);
        }
    };

    const addEquipment = () => {
        setEquipments([...equipments, { equipmentId: '', description: '', baseValue: '', depreciation: '', quantity: '' }]);
        focusElement(`input-equipment-id-${equipments.length}`);
    };
    const removeEquipment = (index: number) => setEquipments(equipments.filter((_, i) => i !== index));
    const updateEquipment = (index: number, field: string, value: string | number) => {
        const newEqs = [...equipments];
        newEqs[index] = { ...newEqs[index], [field]: value };
        setEquipments(newEqs);
    };
    const handleEquipmentAutoFill = (index: number, idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogEquipments.find(e => e.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            const newEqs = [...equipments];
            newEqs[index] = {
                ...newEqs[index], equipmentId: found.id, description: found.description,
                baseValue: found.baseValue, depreciation: found.depreciationFactor
            };
            setEquipments(newEqs);
        } else {
            alert(`Equipo con ID "${idToSearch}" no encontrado.`);
        }
    };

    const addLabor = () => {
        setLabors([...labors, { laborId: '', description: '', dailyWage: '', dotation: '' }]);
        focusElement(`input-labor-id-${labors.length}`);
    };
    const removeLabor = (index: number) => setLabors(labors.filter((_, i) => i !== index));
    const updateLabor = (index: number, field: string, value: string | number) => {
        const newLabs = [...labors];
        newLabs[index] = { ...newLabs[index], [field]: value };
        setLabors(newLabs);
    };
    const handleLaborAutoFill = (index: number, idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogLabors.find(l => l.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            const newLabs = [...labors];
            newLabs[index] = {
                ...newLabs[index], laborId: found.id, description: found.description,
                dailyWage: found.baseDailyWage
            };
            setLabors(newLabs);
        } else {
            alert(`Cargo con ID "${idToSearch}" no encontrado.`);
        }
    };

    const handleItemKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>, type: 'material' | 'equipment' | 'labor',
        index: number, value: string, isQuantity: boolean, totalItems: number
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!isQuantity) {
                if (type === 'material') handleMaterialAutoFill(index, value);
                if (type === 'equipment') handleEquipmentAutoFill(index, value);
                if (type === 'labor') handleLaborAutoFill(index, value);
                focusElement(`input-${type}-qty-${index}`);
            } else {
                if (index + 1 < totalItems) focusElement(`input-${type}-id-${index + 1}`);
                else focusElement(`btn-add-${type}`);
            }
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-5xl mx-auto border border-base-200">
            <h1 className="text-2xl font-bold mb-6">Crear Nuevo APU</h1>

            {/* --- SECCIÓN 1: DATOS GENERALES --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 border-b pb-8">
                <div className="form-control md:col-span-1">
                    <label className="label"><span className="label-text font-bold">Solicitud (ID)*</span></label>
                    <input id="input-serviceRequest" type="text" name="serviceRequest" value={header.serviceRequest} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-mainProcess')} className="input input-bordered w-full" placeholder="Ej: SR-2026-001" required autoFocus />
                </div>
                <div className="form-control md:col-span-3">
                    <label className="label"><span className="label-text font-bold">Proceso Principal*</span></label>
                    <input id="input-mainProcess" type="text" name="mainProcess" value={header.mainProcess} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-companyId')} className="input input-bordered w-full" placeholder="Ej: Rebobinado Motor" required />
                </div>

                <div className="form-control md:col-span-1">
                    <label className="label"><span className="label-text font-bold">Empresa (ID)*</span></label>
                    <input id="input-companyId" type="text" name="companyId" value={header.companyId} onChange={handleInputChange} onBlur={(e) => handleCompanyAutoFill(e.target.value)} onKeyDown={handleCompanyKeyDown} className="input input-bordered w-full" placeholder="Ej: EMP-01" required />
                </div>
                <div className="form-control md:col-span-3">
                    <label className="label"><span className="label-text font-bold">Nombre de la Empresa (Autocompletado)</span></label>
                    <input type="text" name="companyName" value={header.companyName} className="input input-bordered w-full bg-base-200" placeholder="Se autocompleta..." disabled />
                </div>

                <div className="form-control md:col-span-4">
                    <label className="label"><span className="label-text font-bold">Descripción del Servicio*</span></label>
                    <input id="input-description" type="text" name="description" value={header.description} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-power')} className="input input-bordered w-full" required />
                </div>
            </div>

            {/* --- SECCIÓN 2: ESPECIFICACIONES --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 border-b pb-8">
                <div className="form-control"><label className="label"><span className="label-text">Potencia</span></label><input id="input-power" type="text" name="power" value={header.power} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-serial')} className="input input-bordered input-sm" /></div>
                <div className="form-control"><label className="label"><span className="label-text">Serial</span></label><input id="input-serial" type="text" name="serial" value={header.serial} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-brand')} className="input input-bordered input-sm" /></div>
                <div className="form-control"><label className="label"><span className="label-text">Marca</span></label><input id="input-brand" type="text" name="brand" value={header.brand} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-location')} className="input input-bordered input-sm" /></div>
                <div className="form-control"><label className="label"><span className="label-text">Ubicación</span></label><input id="input-location" type="text" name="location" value={header.location} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-itemQuantity')} className="input input-bordered input-sm" /></div>
            </div>

            {/* --- SECCIÓN 3: VARIABLES DE CÁLCULO --- */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="form-control"><label className="label"><span className="label-text font-bold">Cantidad</span></label><input id="input-itemQuantity" type="number" name="itemQuantity" value={header.itemQuantity} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-performance')} className="input input-bordered" step="0.01" /></div>
                <div className="form-control"><label className="label"><span className="label-text font-bold text-primary">Rendimiento*</span></label><input id="input-performance" type="number" name="performance" value={header.performance} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-socialLawsPercentage')} className="input input-bordered border-primary" step="0.01" required /></div>
                <div className="form-control"><label className="label"><span className="label-text">% Leyes Soc.</span></label><input id="input-socialLawsPercentage" type="number" name="socialLawsPercentage" value={header.socialLawsPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-adminPercentage')} className="input input-bordered" step="0.01" /></div>
                <div className="form-control"><label className="label"><span className="label-text">% Admin.</span></label><input id="input-adminPercentage" type="number" name="adminPercentage" value={header.adminPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-utilityContingencyPercentage')} className="input input-bordered" step="0.01" /></div>
                {/* Al dar Enter en Utilidad, salta al primer material o al botón de agregar si no hay ninguno */}
                <div className="form-control"><label className="label"><span className="label-text">% Utilidad</span></label><input id="input-utilityContingencyPercentage" type="number" name="utilityContingencyPercentage" value={header.utilityContingencyPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, materials.length > 0 ? 'input-material-id-0' : 'btn-add-material')} className="input input-bordered" step="0.01" /></div>
            </div>

            {/* --- SECCIÓN 4: LISTAS DE DETALLES --- */}
            <div className="flex flex-col gap-6 mb-8 overflow-x-auto">
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>🔧</span> Materiales</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_80px_100px_100px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Unidad</div><div>Precio</div><div>Cantidad</div><div></div>
                    </div>
                    {materials.map((mat, index) => (
                        <div key={`mat-${index}`} className="grid grid-cols-[120px_minmax(150px,1fr)_80px_100px_100px_40px] gap-3 mb-2 items-center">
                            <input id={`input-material-id-${index}`} type="text" className="input input-sm input-bordered w-full" placeholder="Ej: MAT-001" value={mat.materialId} onChange={(e) => updateMaterial(index, 'materialId', e.target.value)} onBlur={(e) => handleMaterialAutoFill(index, e.target.value)} onKeyDown={(e) => handleItemKeyDown(e, 'material', index, e.currentTarget.value, false, materials.length)} />
                            <input type="text" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={mat.description} disabled />
                            <input type="text" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={mat.unit} disabled />
                            <input type="number" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={mat.price} disabled />
                            <input id={`input-material-qty-${index}`} type="number" className="input input-sm input-bordered w-full" value={mat.quantity} onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))} onKeyDown={(e) => handleItemKeyDown(e, 'material', index, e.currentTarget.value, true, materials.length)} />
                            <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeMaterial(index)}>-</button>
                        </div>
                    ))}
                    <button id="btn-add-material" type="button" onClick={addMaterial} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Material</button>
                </div>

                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>⚙️</span> Equipos</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_100px_120px_100px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Precio Inicial</div><div>Factor Deprec.</div><div>Cantidad</div><div></div>
                    </div>
                    {equipments.map((eq, index) => (
                        <div key={`eq-${index}`} className="grid grid-cols-[120px_minmax(150px,1fr)_100px_120px_100px_40px] gap-3 mb-2 items-center">
                            <input id={`input-equipment-id-${index}`} type="text" className="input input-sm input-bordered w-full" placeholder="Ej: EQU-001" value={eq.equipmentId} onChange={(e) => updateEquipment(index, 'equipmentId', e.target.value)} onBlur={(e) => handleEquipmentAutoFill(index, e.target.value)} onKeyDown={(e) => handleItemKeyDown(e, 'equipment', index, e.currentTarget.value, false, equipments.length)} />
                            <input type="text" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={eq.description} disabled />
                            <input type="number" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={eq.baseValue} disabled />
                            <input type="number" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={eq.depreciation} disabled />
                            <input id={`input-equipment-qty-${index}`} type="number" className="input input-sm input-bordered w-full" value={eq.quantity} onChange={(e) => updateEquipment(index, 'quantity', parseFloat(e.target.value))} onKeyDown={(e) => handleItemKeyDown(e, 'equipment', index, e.currentTarget.value, true, equipments.length)} />
                            <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeEquipment(index)}>-</button>
                        </div>
                    ))}
                    <button id="btn-add-equipment" type="button" onClick={addEquipment} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Equipo</button>
                </div>

                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>👷</span> Mano de Obra</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_120px_120px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Salario diario</div><div>Dotación</div><div></div>
                    </div>
                    {labors.map((lab, index) => (
                        <div key={`lab-${index}`} className="grid grid-cols-[120px_minmax(150px,1fr)_120px_120px_40px] gap-3 mb-2 items-center">
                            <input id={`input-labor-id-${index}`} type="text" className="input input-sm input-bordered w-full" placeholder="Ej: MDO-001" value={lab.laborId} onChange={(e) => updateLabor(index, 'laborId', e.target.value)} onBlur={(e) => handleLaborAutoFill(index, e.target.value)} onKeyDown={(e) => handleItemKeyDown(e, 'labor', index, e.currentTarget.value, false, labors.length)} />
                            <input type="text" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={lab.description} disabled />
                            <input type="number" className="input input-sm input-bordered w-full bg-base-200 text-base-content/60" value={lab.dailyWage} disabled />
                            <input id={`input-labor-qty-${index}`} type="number" className="input input-sm input-bordered w-full" value={lab.dotation} onChange={(e) => updateLabor(index, 'dotation', parseFloat(e.target.value))} onKeyDown={(e) => handleItemKeyDown(e, 'labor', index, e.currentTarget.value, true, labors.length)} />
                            <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeLabor(index)}>-</button>
                        </div>
                    ))}
                    <button id="btn-add-labor" type="button" onClick={addLabor} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Mano de Obra</button>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
                <button type="button" onClick={() => navigate('/')} className="btn btn-ghost">Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={() => console.log({ ...header, materials, equipments, labors })}>Generar APU</button>
            </div>
        </div>
    );
}