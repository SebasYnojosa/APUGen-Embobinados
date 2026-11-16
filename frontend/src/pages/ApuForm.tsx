import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService } from '../services/catalogServices';
import api from '../services/api'; // Necesario para el POST final
import type { Material, Equipment, Labor, Company } from '../types';

export default function ApuForm() {
    const navigate = useNavigate();

    const [catalogCompanies, setCatalogCompanies] = useState<Company[]>([]);
    const [catalogMaterials, setCatalogMaterials] = useState<Material[]>([]);
    const [catalogEquipments, setCatalogEquipments] = useState<Equipment[]>([]);
    const [catalogLabors, setCatalogLabors] = useState<Labor[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [comps, mats, eqs, labs] = await Promise.all([
                    catalogService.getCompanies(), catalogService.getMaterials(),
                    catalogService.getEquipments(), catalogService.getLabors()
                ]);
                setCatalogCompanies(comps); setCatalogMaterials(mats);
                setCatalogEquipments(eqs); setCatalogLabors(labs);
            } catch (error) {
                console.error("Error cargando catálogos:", error);
            }
        };
        fetchCatalogs();
    }, []);

    // Agregamos isNewCompany para saber si debemos crearla al guardar
    const [header, setHeader] = useState({
        serviceRequest: '', companyId: '', companyName: '', isNewCompany: false, mainProcess: '', description: '',
        power: '', serial: '', brand: '', location: '',
        itemQuantity: 1, performance: 1, socialLawsPercentage: 0.75,
        adminPercentage: 0.15, utilityContingencyPercentage: 0.10
    });

    // Se agrega "isNew" a las listas
    const [materials, setMaterials] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [labors, setLabors] = useState<any[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHeader(prev => ({ ...prev, [name]: value }));
    };

    const focusElement = (id: string) => {
        setTimeout(() => document.getElementById(id)?.focus(), 50);
    };

    const handleEnterFocus = (e: React.KeyboardEvent<HTMLInputElement>, nextId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusElement(nextId);
        }
    };

    // ==========================================
    // AUTOCOMPLETADO Y CREACIÓN AL VUELO
    // ==========================================
    const handleCompanyAutoFill = (idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogCompanies.find(c => c.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            setHeader(prev => ({ ...prev, companyId: found.id, companyName: found.name, isNewCompany: false }));
            focusElement('input-description');
        } else {
            setHeader(prev => ({ ...prev, companyName: '', isNewCompany: true })); // Desbloquea el campo
            focusElement('input-companyName'); // Salta al nombre para que lo cree
        }
    };

    // MATERIALES
    const addMaterial = () => {
        setMaterials([...materials, { materialId: '', description: '', unit: '', price: '', quantity: '', isNew: false }]);
        focusElement(`input-material-id-${materials.length}`);
    };
    const removeMaterial = (index: number) => setMaterials(materials.filter((_, i) => i !== index));
    const updateMaterial = (index: number, field: string, value: string | number | boolean) => {
        const newMaterials = [...materials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setMaterials(newMaterials);
    };
    const handleMaterialAutoFill = (index: number, idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogMaterials.find(m => m.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            const newMats = [...materials];
            newMats[index] = { ...newMats[index], materialId: found.id, description: found.description, unit: found.unit, price: found.baseCost, isNew: false };
            setMaterials(newMats);
            focusElement(`input-material-qty-${index}`); // Si existe, salta directo a la cantidad
        } else {
            updateMaterial(index, 'isNew', true); // Si NO existe, desbloquea los campos
            focusElement(`input-material-desc-${index}`); // Salta a la descripción para que la escriba
        }
    };

    // EQUIPOS
    const addEquipment = () => {
        setEquipments([...equipments, { equipmentId: '', description: '', baseValue: '', depreciation: '', quantity: '', isNew: false }]);
        focusElement(`input-equipment-id-${equipments.length}`);
    };
    const removeEquipment = (index: number) => setEquipments(equipments.filter((_, i) => i !== index));
    const updateEquipment = (index: number, field: string, value: string | number | boolean) => {
        const newEqs = [...equipments];
        newEqs[index] = { ...newEqs[index], [field]: value };
        setEquipments(newEqs);
    };
    const handleEquipmentAutoFill = (index: number, idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogEquipments.find(e => e.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            const newEqs = [...equipments];
            newEqs[index] = { ...newEqs[index], equipmentId: found.id, description: found.description, baseValue: found.baseValue, depreciation: found.depreciationFactor, isNew: false };
            setEquipments(newEqs);
            focusElement(`input-equipment-qty-${index}`);
        } else {
            updateEquipment(index, 'isNew', true);
            focusElement(`input-equipment-desc-${index}`);
        }
    };

    // MANO DE OBRA
    const addLabor = () => {
        setLabors([...labors, { laborId: '', description: '', dailyWage: '', dotation: '', isNew: false }]);
        focusElement(`input-labor-id-${labors.length}`);
    };
    const removeLabor = (index: number) => setLabors(labors.filter((_, i) => i !== index));
    const updateLabor = (index: number, field: string, value: string | number | boolean) => {
        const newLabs = [...labors];
        newLabs[index] = { ...newLabs[index], [field]: value };
        setLabors(newLabs);
    };
    const handleLaborAutoFill = (index: number, idToSearch: string) => {
        if (!idToSearch) return;
        const found = catalogLabors.find(l => l.id.toLowerCase() === idToSearch.toLowerCase());
        if (found) {
            const newLabs = [...labors];
            newLabs[index] = { ...newLabs[index], laborId: found.id, description: found.description, dailyWage: found.baseDailyWage, isNew: false };
            setLabors(newLabs);
            focusElement(`input-labor-qty-${index}`);
        } else {
            updateLabor(index, 'isNew', true);
            focusElement(`input-labor-desc-${index}`);
        }
    };

    // ==========================================
    // ENVÍO AL BACKEND (POST MAESTRO)
    // ==========================================
    const handleSubmit = async () => {
        try {
            setIsSaving(true);

            // 1. Crear Empresa si es nueva
            if (header.isNewCompany) {
                await catalogService.createCompany({ id: header.companyId, name: header.companyName });
            }

            // 2. Crear Materiales nuevos
            for (const mat of materials) {
                if (mat.isNew) {
                    await catalogService.createMaterial({ id: mat.materialId, description: mat.description, unit: mat.unit, baseCost: parseFloat(mat.price) });
                }
            }

            // 3. Crear Equipos nuevos
            for (const eq of equipments) {
                if (eq.isNew) {
                    await catalogService.createEquipment({ id: eq.equipmentId, description: eq.description, baseValue: parseFloat(eq.baseValue), depreciationFactor: parseFloat(eq.depreciation) });
                }
            }

            // 4. Crear Cargos nuevos
            for (const lab of labors) {
                if (lab.isNew) {
                    await catalogService.createLabor({ id: lab.laborId, description: lab.description, baseDailyWage: parseFloat(lab.dailyWage) });
                }
            }

            // 5. Estructurar el JSON final del APU (ApuRequestDTO)
            const apuDTO = {
                serviceRequest: header.serviceRequest,
                companyId: header.companyId,
                mainProcess: header.mainProcess,
                description: header.description,
                power: header.power,
                serial: header.serial,
                brand: header.brand,
                location: header.location,
                itemQuantity: parseFloat(header.itemQuantity.toString()),
                performance: parseFloat(header.performance.toString()),
                socialLawsPercentage: parseFloat(header.socialLawsPercentage.toString()),
                adminPercentage: parseFloat(header.adminPercentage.toString()),
                utilityContingencyPercentage: parseFloat(header.utilityContingencyPercentage.toString()),
                // Mapeamos las listas limpias solo con ID y cantidades (como lo espera Spring Boot)
                materials: materials.map(m => ({ materialId: m.materialId, quantity: parseFloat(m.quantity) })),
                equipments: equipments.map(e => ({ equipmentId: e.equipmentId, quantity: parseFloat(e.quantity) })),
                labors: labors.map(l => ({ laborId: l.laborId, dotation: parseFloat(l.dotation) }))
            };

            // 6. Enviar APU
            await api.post('/apus/generar', apuDTO);
            alert("APU Generado y Guardado Exitosamente 🎉");
            navigate('/'); // Redirige al listado

        } catch (error: any) {
            alert("Error al generar APU: " + (error.response?.data?.message || "Revisa los campos"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-5xl mx-auto border border-base-200">
            <h1 className="text-2xl font-bold mb-6">Crear Nuevo APU</h1>

            {/* CABECERA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 border-b pb-8">
                <div className="form-control md:col-span-1">
                    <label className="label"><span className="label-text font-bold">Solicitud (ID)*</span></label>
                    <input id="input-serviceRequest" type="text" name="serviceRequest" value={header.serviceRequest} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-mainProcess')} className="input input-bordered w-full" placeholder="Ej: SR-2026-001" required autoFocus />
                </div>
                <div className="form-control md:col-span-3">
                    <label className="label"><span className="label-text font-bold">Proceso Principal*</span></label>
                    <input id="input-mainProcess" type="text" name="mainProcess" value={header.mainProcess} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-companyId')} className="input input-bordered w-full" required />
                </div>

                <div className="form-control md:col-span-1">
                    <label className="label"><span className="label-text font-bold">Empresa (ID)*</span></label>
                    <input id="input-companyId" type="text" name="companyId" value={header.companyId} onChange={handleInputChange} onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); handleCompanyAutoFill(e.currentTarget.value); } }} onBlur={(e) => handleCompanyAutoFill(e.target.value)} className="input input-bordered w-full" required />
                </div>
                <div className="form-control md:col-span-3">
                    <label className="label"><span className="label-text font-bold">Nombre de la Empresa {header.isNewCompany && <span className="text-error ml-2">(Creando Nueva)</span>}</span></label>
                    {/* El input se desbloquea dinámicamente si isNewCompany es true */}
                    <input id="input-companyName" type="text" name="companyName" value={header.companyName} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-description')} className={`input input-bordered w-full ${!header.isNewCompany && 'bg-base-200'}`} disabled={!header.isNewCompany} />
                </div>

                <div className="form-control md:col-span-4">
                    <label className="label"><span className="label-text font-bold">Descripción del Servicio*</span></label>
                    <input id="input-description" type="text" name="description" value={header.description} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-power')} className="input input-bordered w-full" required />
                </div>
            </div>

            {/* ESPECIFICACIONES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 border-b pb-8">
                <div className="form-control"><label className="label"><span className="label-text">Potencia</span></label><input id="input-power" type="text" name="power" value={header.power} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-serial')} className="input input-bordered input-sm" /></div>
                <div className="form-control"><label className="label"><span className="label-text">Serial</span></label><input id="input-serial" type="text" name="serial" value={header.serial} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-brand')} className="input input-bordered input-sm" /></div>
                <div className="form-control"><label className="label"><span className="label-text">Marca</span></label><input id="input-brand" type="text" name="brand" value={header.brand} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-location')} className="input input-bordered input-sm" /></div>
                <div className="form-control"><label className="label"><span className="label-text">Ubicación</span></label><input id="input-location" type="text" name="location" value={header.location} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-itemQuantity')} className="input input-bordered input-sm" /></div>
            </div>

            {/* VARIABLES DE CÁLCULO */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="form-control"><label className="label"><span className="label-text font-bold">Cantidad</span></label><input id="input-itemQuantity" type="number" name="itemQuantity" value={header.itemQuantity} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-performance')} className="input input-bordered" step="0.01" /></div>
                <div className="form-control"><label className="label"><span className="label-text font-bold text-primary">Rendimiento*</span></label><input id="input-performance" type="number" name="performance" value={header.performance} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-socialLawsPercentage')} className="input input-bordered border-primary" step="0.01" required /></div>
                <div className="form-control"><label className="label"><span className="label-text">% Leyes Soc.</span></label><input id="input-socialLawsPercentage" type="number" name="socialLawsPercentage" value={header.socialLawsPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-adminPercentage')} className="input input-bordered" step="0.01" /></div>
                <div className="form-control"><label className="label"><span className="label-text">% Admin.</span></label><input id="input-adminPercentage" type="number" name="adminPercentage" value={header.adminPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-utilityContingencyPercentage')} className="input input-bordered" step="0.01" /></div>
                <div className="form-control"><label className="label"><span className="label-text">% Utilidad</span></label><input id="input-utilityContingencyPercentage" type="number" name="utilityContingencyPercentage" value={header.utilityContingencyPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, materials.length > 0 ? 'input-material-id-0' : 'btn-add-material')} className="input input-bordered" step="0.01" /></div>
            </div>

            {/* LISTAS DE DETALLES */}
            <div className="flex flex-col gap-6 mb-8 overflow-x-auto">

                {/* MATERIALES */}
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>🔧</span> Materiales</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_80px_100px_100px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Unidad</div><div>Precio</div><div>Cantidad</div><div></div>
                    </div>
                    {materials.map((mat, index) => (
                        <div key={`mat-${index}`} className={`grid grid-cols-[120px_minmax(150px,1fr)_80px_100px_100px_40px] gap-3 mb-2 items-center p-1 rounded ${mat.isNew && 'bg-warning/10 border border-warning/30'}`}>
                            <input id={`input-material-id-${index}`} type="text" className="input input-sm input-bordered w-full" value={mat.materialId} onChange={(e) => updateMaterial(index, 'materialId', e.target.value)} onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); handleMaterialAutoFill(index, e.currentTarget.value); } }} onBlur={(e) => handleMaterialAutoFill(index, e.target.value)} />
                            <input id={`input-material-desc-${index}`} type="text" className={`input input-sm input-bordered w-full ${!mat.isNew && 'bg-base-200'}`} value={mat.description} onChange={(e) => updateMaterial(index, 'description', e.target.value)} disabled={!mat.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-material-unit-${index}`)} />
                            <input id={`input-material-unit-${index}`} type="text" className={`input input-sm input-bordered w-full ${!mat.isNew && 'bg-base-200'}`} value={mat.unit} onChange={(e) => updateMaterial(index, 'unit', e.target.value)} disabled={!mat.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-material-price-${index}`)} />
                            <input id={`input-material-price-${index}`} type="number" className={`input input-sm input-bordered w-full ${!mat.isNew && 'bg-base-200'}`} value={mat.price} onChange={(e) => updateMaterial(index, 'price', e.target.value)} disabled={!mat.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-material-qty-${index}`)} />
                            <input id={`input-material-qty-${index}`} type="number" className="input input-sm input-bordered w-full" value={mat.quantity} onChange={(e) => updateMaterial(index, 'quantity', e.target.value)} onKeyDown={(e) => handleEnterFocus(e, index + 1 < materials.length ? `input-material-id-${index + 1}` : 'btn-add-material')} />
                            <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeMaterial(index)}>-</button>
                        </div>
                    ))}
                    <button id="btn-add-material" type="button" onClick={addMaterial} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Material</button>
                </div>

                {/* EQUIPOS */}
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>⚙️</span> Equipos</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_100px_120px_100px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Precio Inicial</div><div>Factor Deprec.</div><div>Cantidad</div><div></div>
                    </div>
                    {equipments.map((eq, index) => (
                        <div key={`eq-${index}`} className={`grid grid-cols-[120px_minmax(150px,1fr)_100px_120px_100px_40px] gap-3 mb-2 items-center p-1 rounded ${eq.isNew && 'bg-warning/10 border border-warning/30'}`}>
                            <input id={`input-equipment-id-${index}`} type="text" className="input input-sm input-bordered w-full" value={eq.equipmentId} onChange={(e) => updateEquipment(index, 'equipmentId', e.target.value)} onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); handleEquipmentAutoFill(index, e.currentTarget.value); } }} onBlur={(e) => handleEquipmentAutoFill(index, e.target.value)} />
                            <input id={`input-equipment-desc-${index}`} type="text" className={`input input-sm input-bordered w-full ${!eq.isNew && 'bg-base-200'}`} value={eq.description} onChange={(e) => updateEquipment(index, 'description', e.target.value)} disabled={!eq.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-equipment-price-${index}`)} />
                            <input id={`input-equipment-price-${index}`} type="number" className={`input input-sm input-bordered w-full ${!eq.isNew && 'bg-base-200'}`} value={eq.baseValue} onChange={(e) => updateEquipment(index, 'baseValue', e.target.value)} disabled={!eq.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-equipment-deprec-${index}`)} />
                            <input id={`input-equipment-deprec-${index}`} type="number" className={`input input-sm input-bordered w-full ${!eq.isNew && 'bg-base-200'}`} value={eq.depreciation} onChange={(e) => updateEquipment(index, 'depreciation', e.target.value)} disabled={!eq.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-equipment-qty-${index}`)} />
                            <input id={`input-equipment-qty-${index}`} type="number" className="input input-sm input-bordered w-full" value={eq.quantity} onChange={(e) => updateEquipment(index, 'quantity', e.target.value)} onKeyDown={(e) => handleEnterFocus(e, index + 1 < equipments.length ? `input-equipment-id-${index + 1}` : 'btn-add-equipment')} />
                            <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeEquipment(index)}>-</button>
                        </div>
                    ))}
                    <button id="btn-add-equipment" type="button" onClick={addEquipment} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Equipo</button>
                </div>

                {/* MANO DE OBRA */}
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>👷</span> Mano de Obra</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_120px_120px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Salario diario</div><div>Dotación</div><div></div>
                    </div>
                    {labors.map((lab, index) => (
                        <div key={`lab-${index}`} className={`grid grid-cols-[120px_minmax(150px,1fr)_120px_120px_40px] gap-3 mb-2 items-center p-1 rounded ${lab.isNew && 'bg-warning/10 border border-warning/30'}`}>
                            <input id={`input-labor-id-${index}`} type="text" className="input input-sm input-bordered w-full" value={lab.laborId} onChange={(e) => updateLabor(index, 'laborId', e.target.value)} onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); handleLaborAutoFill(index, e.currentTarget.value); } }} onBlur={(e) => handleLaborAutoFill(index, e.target.value)} />
                            <input id={`input-labor-desc-${index}`} type="text" className={`input input-sm input-bordered w-full ${!lab.isNew && 'bg-base-200'}`} value={lab.description} onChange={(e) => updateLabor(index, 'description', e.target.value)} disabled={!lab.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-labor-wage-${index}`)} />
                            <input id={`input-labor-wage-${index}`} type="number" className={`input input-sm input-bordered w-full ${!lab.isNew && 'bg-base-200'}`} value={lab.dailyWage} onChange={(e) => updateLabor(index, 'dailyWage', e.target.value)} disabled={!lab.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-labor-qty-${index}`)} />
                            <input id={`input-labor-qty-${index}`} type="number" className="input input-sm input-bordered w-full" value={lab.dotation} onChange={(e) => updateLabor(index, 'dotation', e.target.value)} onKeyDown={(e) => handleEnterFocus(e, index + 1 < labors.length ? `input-labor-id-${index + 1}` : 'btn-add-labor')} />
                            <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeLabor(index)}>-</button>
                        </div>
                    ))}
                    <button id="btn-add-labor" type="button" onClick={addLabor} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Mano de Obra</button>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
                <button type="button" onClick={() => navigate('/')} className="btn btn-ghost" disabled={isSaving}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? <span className="loading loading-spinner"></span> : 'Generar APU'}
                </button>
            </div>
        </div>
    );
}