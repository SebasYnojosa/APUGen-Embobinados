import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { catalogService } from '../services/catalogServices';
import { apuService } from '../services/apuServices';
import type { Material, Equipment, Labor, Process } from '../types';

const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

type ResourceDropdown = {
    type: 'material' | 'equipment' | 'labor';
    index: number;
} | null;

export default function ApuForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const createForProcess = searchParams.get('serviceRequest');
    const editServiceId = searchParams.get('serviceId');
    const isEditing = Boolean(editServiceId);

    const [parentProcess, setParentProcess] = useState<Process | null>(null);
    const [catalogMaterials, setCatalogMaterials] = useState<Material[]>([]);
    const [catalogEquipments, setCatalogEquipments] = useState<Equipment[]>([]);
    const [catalogLabors, setCatalogLabors] = useState<Labor[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [activeDropdown, setActiveDropdown] = useState<ResourceDropdown>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const listsContainerRef = useRef<HTMLDivElement>(null);

    // Estado principal del formulario de Servicio
    const [serviceData, setServiceData] = useState({
        description: '',
        itemQuantity: 1,
        performance: 1,
        socialLawsPercentage: 0.75,
        adminPercentage: 0.15,
        utilityContingencyPercentage: 0.10,
    });

    const [materials, setMaterials] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [labors, setLabors] = useState<any[]>([]);

    // Snapshot original para detectar campos modificados en modo edición
    const [originalServiceData, setOriginalServiceData] = useState<typeof serviceData | null>(null);
    const [originalMaterials, setOriginalMaterials] = useState<any[]>([]);
    const [originalEquipments, setOriginalEquipments] = useState<any[]>([]);
    const [originalLabors, setOriginalLabors] = useState<any[]>([]);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [mats, eqs, labs] = await Promise.all([
                    catalogService.getMaterials(),
                    catalogService.getEquipments(),
                    catalogService.getLabors(),
                ]);
                setCatalogMaterials(mats);
                setCatalogEquipments(eqs);
                setCatalogLabors(labs);
            } catch (error) {
                console.error('Error cargando catálogos:', error);
            }
        };
        fetchCatalogs();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listsContainerRef.current && !listsContainerRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadContext = async () => {
            try {
                if (editServiceId) {
                    const data = await apuService.getServiceById(editServiceId);
                    setParentProcess(data.process);

                    const s = data.service;
                    const loadedService = {
                        description: s.description,
                        itemQuantity: s.itemQuantity,
                        performance: s.performance,
                        socialLawsPercentage: s.socialLawsPercentage,
                        adminPercentage: s.adminPercentage,
                        utilityContingencyPercentage: s.utilityContingencyPercentage,
                    };

                    const loadedMaterials = data.materials.map(m => ({
                        materialId: m.material.id,
                        description: m.descriptionSnapshot,
                        unit: m.unitSnapshot,
                        price: m.costApplied,
                        quantity: m.quantity,
                        isNew: false,
                    }));

                    const loadedEquipments = data.equipments.map(e => ({
                        equipmentId: e.equipment.id,
                        description: e.descriptionSnapshot,
                        baseValue: e.valueApplied,
                        depreciation: e.depreciationFactorApplied,
                        quantity: e.quantity,
                        isNew: false,
                    }));

                    const loadedLabors = data.labors.map(l => ({
                        laborId: l.labor.id,
                        description: l.descriptionSnapshot,
                        dailyWage: l.dailyWageApplied,
                        dotation: l.dotation,
                        isNew: false,
                    }));

                    setServiceData(loadedService);
                    setOriginalServiceData(loadedService);

                    setMaterials(loadedMaterials);
                    setOriginalMaterials(loadedMaterials);

                    setEquipments(loadedEquipments);
                    setOriginalEquipments(loadedEquipments);

                    setLabors(loadedLabors);
                    setOriginalLabors(loadedLabors);
                } else if (createForProcess) {
                    const data = await apuService.getProcessByServiceRequest(createForProcess);
                    setParentProcess(data.process);
                } else {
                    alert('Debe seleccionar un proceso (obra) para crear o editar un servicio.');
                    navigate('/apus');
                }
            } catch (err: any) {
                alert(err.response?.data?.message || 'Error al cargar los datos del servicio.');
                navigate('/apus');
            }
        };
        loadContext();
    }, [editServiceId, createForProcess, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setServiceData(prev => ({ ...prev, [name]: value }));
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

    const closeDropdown = () => {
        setActiveDropdown(null);
        setHighlightedIndex(-1);
    };

    // ==========================================
    // MATERIALES (ID + BÚSQUEDA POR DESCRIPCIÓN)
    // ==========================================
    const getFilteredMaterials = (query: string) => {
        const normalized = normalizeText(query);
        if (!normalized) return [];
        return catalogMaterials.filter(m => normalizeText(m.description).startsWith(normalized));
    };

    const addMaterial = () => {
        setMaterials([...materials, { materialId: '', description: '', unit: '', price: '', quantity: '', isNew: false }]);
        focusElement(`input-material-id-${materials.length}`);
    };
    const removeMaterial = (index: number) => {
        setMaterials(materials.filter((_, i) => i !== index));
        closeDropdown();
    };
    const updateMaterial = (index: number, field: string, value: string | number | boolean) => {
        const newMaterials = [...materials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setMaterials(newMaterials);
    };
    const selectMaterial = (index: number, found: Material) => {
        const newMats = [...materials];
        newMats[index] = {
            ...newMats[index],
            materialId: found.id,
            description: found.description,
            unit: found.unit,
            price: found.baseCost,
            isNew: false,
        };
        setMaterials(newMats);
        closeDropdown();
        focusElement(`input-material-qty-${index}`);
    };
    const handleMaterialAutoFill = (index: number, idToSearch: string) => {
        const trimmed = idToSearch.trim();
        if (!trimmed) return;
        const found = catalogMaterials.find(m => m.id.toLowerCase() === trimmed.toLowerCase());
        if (found) {
            selectMaterial(index, found);
        } else {
            const newMats = [...materials];
            const current = newMats[index];
            const descBelongsToExisting = catalogMaterials.some(
                m => normalizeText(m.description) === normalizeText(current.description || '')
            );
            newMats[index] = {
                ...current,
                description: descBelongsToExisting ? '' : current.description,
                unit: descBelongsToExisting ? '' : current.unit,
                price: descBelongsToExisting ? '' : current.price,
                isNew: true,
            };
            setMaterials(newMats);
            focusElement(`input-material-desc-${index}`);
        }
    };
    const handleMaterialDescChange = (index: number, value: string) => {
        const newMats = [...materials];
        const current = newMats[index];
        if (current.isNew) {
            newMats[index] = { ...current, description: value };
        } else {
            newMats[index] = { ...current, materialId: '', description: value, unit: '', price: '', isNew: false };
        }
        setMaterials(newMats);
        setActiveDropdown(value.trim().length > 0 ? { type: 'material', index } : null);
        setHighlightedIndex(-1);
    };
    const handleMaterialDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        const isOpen = activeDropdown?.type === 'material' && activeDropdown.index === index;
        const matches = isOpen ? getFilteredMaterials(materials[index].description || '') : [];

        if (isOpen && matches.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % matches.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev <= 0 ? matches.length - 1 : prev - 1));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
                    selectMaterial(index, matches[highlightedIndex]);
                } else if (!materials[index].isNew && matches.length === 1) {
                    selectMaterial(index, matches[0]);
                } else {
                    closeDropdown();
                    focusElement(materials[index].isNew ? `input-material-unit-${index}` : `input-material-qty-${index}`);
                }
                return;
            }
            if (e.key === 'Escape') {
                closeDropdown();
                return;
            }
        }
        handleEnterFocus(e, materials[index].isNew ? `input-material-unit-${index}` : `input-material-qty-${index}`);
    };

    // ==========================================
    // EQUIPOS (ID + BÚSQUEDA POR DESCRIPCIÓN)
    // ==========================================
    const getFilteredEquipments = (query: string) => {
        const normalized = normalizeText(query);
        if (!normalized) return [];
        return catalogEquipments.filter(eq => normalizeText(eq.description).startsWith(normalized));
    };

    const addEquipment = () => {
        setEquipments([...equipments, { equipmentId: '', description: '', baseValue: '', depreciation: '', quantity: '', isNew: false }]);
        focusElement(`input-equipment-id-${equipments.length}`);
    };
    const removeEquipment = (index: number) => {
        setEquipments(equipments.filter((_, i) => i !== index));
        closeDropdown();
    };
    const updateEquipment = (index: number, field: string, value: string | number | boolean) => {
        const newEqs = [...equipments];
        newEqs[index] = { ...newEqs[index], [field]: value };
        setEquipments(newEqs);
    };
    const selectEquipment = (index: number, found: Equipment) => {
        const newEqs = [...equipments];
        newEqs[index] = {
            ...newEqs[index],
            equipmentId: found.id,
            description: found.description,
            baseValue: found.baseValue,
            depreciation: found.depreciationFactor,
            isNew: false,
        };
        setEquipments(newEqs);
        closeDropdown();
        focusElement(`input-equipment-qty-${index}`);
    };
    const handleEquipmentAutoFill = (index: number, idToSearch: string) => {
        const trimmed = idToSearch.trim();
        if (!trimmed) return;
        const found = catalogEquipments.find(e => e.id.toLowerCase() === trimmed.toLowerCase());
        if (found) {
            selectEquipment(index, found);
        } else {
            const newEqs = [...equipments];
            const current = newEqs[index];
            const descBelongsToExisting = catalogEquipments.some(
                e => normalizeText(e.description) === normalizeText(current.description || '')
            );
            newEqs[index] = {
                ...current,
                description: descBelongsToExisting ? '' : current.description,
                baseValue: descBelongsToExisting ? '' : current.baseValue,
                depreciation: descBelongsToExisting ? '' : current.depreciation,
                isNew: true,
            };
            setEquipments(newEqs);
            focusElement(`input-equipment-desc-${index}`);
        }
    };
    const handleEquipmentDescChange = (index: number, value: string) => {
        const newEqs = [...equipments];
        const current = newEqs[index];
        if (current.isNew) {
            newEqs[index] = { ...current, description: value };
        } else {
            newEqs[index] = { ...current, equipmentId: '', description: value, baseValue: '', depreciation: '', isNew: false };
        }
        setEquipments(newEqs);
        setActiveDropdown(value.trim().length > 0 ? { type: 'equipment', index } : null);
        setHighlightedIndex(-1);
    };
    const handleEquipmentDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        const isOpen = activeDropdown?.type === 'equipment' && activeDropdown.index === index;
        const matches = isOpen ? getFilteredEquipments(equipments[index].description || '') : [];

        if (isOpen && matches.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % matches.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev <= 0 ? matches.length - 1 : prev - 1));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
                    selectEquipment(index, matches[highlightedIndex]);
                } else if (!equipments[index].isNew && matches.length === 1) {
                    selectEquipment(index, matches[0]);
                } else {
                    closeDropdown();
                    focusElement(equipments[index].isNew ? `input-equipment-price-${index}` : `input-equipment-qty-${index}`);
                }
                return;
            }
            if (e.key === 'Escape') {
                closeDropdown();
                return;
            }
        }
        handleEnterFocus(e, equipments[index].isNew ? `input-equipment-price-${index}` : `input-equipment-qty-${index}`);
    };

    // ==========================================
    // MANO DE OBRA (ID + BÚSQUEDA POR DESCRIPCIÓN)
    // ==========================================
    const getFilteredLabors = (query: string) => {
        const normalized = normalizeText(query);
        if (!normalized) return [];
        return catalogLabors.filter(l => normalizeText(l.description).startsWith(normalized));
    };

    const addLabor = () => {
        setLabors([...labors, { laborId: '', description: '', dailyWage: '', dotation: '', isNew: false }]);
        focusElement(`input-labor-id-${labors.length}`);
    };
    const removeLabor = (index: number) => {
        setLabors(labors.filter((_, i) => i !== index));
        closeDropdown();
    };
    const updateLabor = (index: number, field: string, value: string | number | boolean) => {
        const newLabs = [...labors];
        newLabs[index] = { ...newLabs[index], [field]: value };
        setLabors(newLabs);
    };
    const selectLabor = (index: number, found: Labor) => {
        const newLabs = [...labors];
        newLabs[index] = {
            ...newLabs[index],
            laborId: found.id,
            description: found.description,
            dailyWage: found.baseDailyWage,
            isNew: false,
        };
        setLabors(newLabs);
        closeDropdown();
        focusElement(`input-labor-qty-${index}`);
    };
    const handleLaborAutoFill = (index: number, idToSearch: string) => {
        const trimmed = idToSearch.trim();
        if (!trimmed) return;
        const found = catalogLabors.find(l => l.id.toLowerCase() === trimmed.toLowerCase());
        if (found) {
            selectLabor(index, found);
        } else {
            const newLabs = [...labors];
            const current = newLabs[index];
            const descBelongsToExisting = catalogLabors.some(
                l => normalizeText(l.description) === normalizeText(current.description || '')
            );
            newLabs[index] = {
                ...current,
                description: descBelongsToExisting ? '' : current.description,
                dailyWage: descBelongsToExisting ? '' : current.dailyWage,
                isNew: true,
            };
            setLabors(newLabs);
            focusElement(`input-labor-desc-${index}`);
        }
    };
    const handleLaborDescChange = (index: number, value: string) => {
        const newLabs = [...labors];
        const current = newLabs[index];
        if (current.isNew) {
            newLabs[index] = { ...current, description: value };
        } else {
            newLabs[index] = { ...current, laborId: '', description: value, dailyWage: '', isNew: false };
        }
        setLabors(newLabs);
        setActiveDropdown(value.trim().length > 0 ? { type: 'labor', index } : null);
        setHighlightedIndex(-1);
    };
    const handleLaborDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        const isOpen = activeDropdown?.type === 'labor' && activeDropdown.index === index;
        const matches = isOpen ? getFilteredLabors(labors[index].description || '') : [];

        if (isOpen && matches.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % matches.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev <= 0 ? matches.length - 1 : prev - 1));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
                    selectLabor(index, matches[highlightedIndex]);
                } else if (!labors[index].isNew && matches.length === 1) {
                    selectLabor(index, matches[0]);
                } else {
                    closeDropdown();
                    focusElement(labors[index].isNew ? `input-labor-wage-${index}` : `input-labor-qty-${index}`);
                }
                return;
            }
            if (e.key === 'Escape') {
                closeDropdown();
                return;
            }
        }
        handleEnterFocus(e, labors[index].isNew ? `input-labor-wage-${index}` : `input-labor-qty-${index}`);
    };

    // RESALTADO DE CAMPOS MODIFICADOS EN EDICIÓN
    const getFieldHighlight = (field: keyof typeof serviceData) => {
        if (!isEditing || !originalServiceData) return '';
        return String(serviceData[field]) !== String(originalServiceData[field])
            ? 'bg-warning/20 border-warning'
            : '';
    };

    const getListHighlight = (originalList: any[], index: number, field: string, currentValue: any) => {
        if (!isEditing) return '';
        const originalItem = originalList[index];
        if (!originalItem || String(currentValue) !== String(originalItem[field])) {
            return 'bg-warning/20 border-warning';
        }
        return '';
    };

    const handleSubmit = async () => {
        if (materials.some(m => !String(m.materialId || '').trim())) {
            alert('Hay un material sin ID. Selecciona uno del listado o ingresa un ID para crearlo nuevo.');
            return;
        }
        if (equipments.some(e => !String(e.equipmentId || '').trim())) {
            alert('Hay un equipo sin ID. Selecciona uno del listado o ingresa un ID para crearlo nuevo.');
            return;
        }
        if (labors.some(l => !String(l.laborId || '').trim())) {
            alert('Hay un cargo de mano de obra sin ID. Selecciona uno del listado o ingresa un ID para crearlo nuevo.');
            return;
        }
        for (const eq of equipments) {
            if (eq.isNew) {
                const dep = parseFloat(String(eq.depreciation));
                if (Number.isNaN(dep) || dep === 0) {
                    alert(`El factor de depreciación del equipo "${eq.equipmentId || eq.description}" no puede ser 0.`);
                    return;
                }
                if (dep < 0) {
                    alert(`El factor de depreciación del equipo "${eq.equipmentId || eq.description}" debe ser mayor que 0.`);
                    return;
                }
            }
        }

        try {
            setIsSaving(true);

            // 1. Crear Materiales nuevos al vuelo
            for (const mat of materials) {
                if (mat.isNew) {
                    await catalogService.createMaterial({
                        id: mat.materialId.trim(),
                        description: mat.description.trim(),
                        unit: mat.unit.trim(),
                        baseCost: parseFloat(mat.price),
                    });
                }
            }

            // 2. Crear Equipos nuevos al vuelo
            for (const eq of equipments) {
                if (eq.isNew) {
                    await catalogService.createEquipment({
                        id: eq.equipmentId.trim(),
                        description: eq.description.trim(),
                        baseValue: parseFloat(eq.baseValue),
                        depreciationFactor: parseFloat(eq.depreciation),
                    });
                }
            }

            // 3. Crear Cargos nuevos al vuelo
            for (const lab of labors) {
                if (lab.isNew) {
                    await catalogService.createLabor({
                        id: lab.laborId.trim(),
                        description: lab.description.trim(),
                        baseDailyWage: parseFloat(lab.dailyWage),
                    });
                }
            }

            // 4. Estructurar ServiceRequestDTO
            const serviceDTO = {
                description: serviceData.description,
                itemQuantity: parseFloat(serviceData.itemQuantity.toString()),
                performance: parseFloat(serviceData.performance.toString()),
                socialLawsPercentage: parseFloat(serviceData.socialLawsPercentage.toString()),
                adminPercentage: parseFloat(serviceData.adminPercentage.toString()),
                utilityContingencyPercentage: parseFloat(serviceData.utilityContingencyPercentage.toString()),
                materials: materials.map(m => ({ materialId: m.materialId.trim(), quantity: parseFloat(m.quantity) })),
                equipments: equipments.map(e => ({ equipmentId: e.equipmentId.trim(), quantity: parseFloat(e.quantity) })),
                labors: labors.map(l => ({ laborId: l.laborId.trim(), dotation: parseFloat(l.dotation) })),
            };

            // 5. Enviar al Backend
            if (isEditing && editServiceId) {
                await apuService.updateService(editServiceId, serviceDTO);
                alert(`Servicio ${editServiceId} actualizado correctamente.`);
                navigate(`/apus/servicio/detalle?serviceId=${encodeURIComponent(editServiceId)}`);
            } else if (parentProcess) {
                const created = await apuService.createService(parentProcess.serviceRequest, serviceDTO);
                alert(`Servicio ${created.id} generado y guardado exitosamente.`);
                navigate(`/apus/detalle?serviceRequest=${encodeURIComponent(parentProcess.serviceRequest)}`);
            }
        } catch (error: any) {
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} servicio: ` + (error.response?.data?.message || 'Revisa los campos'));
        } finally {
            setIsSaving(false);
        }
    };

    const goBack = () => {
        if (parentProcess) {
            navigate(`/apus/detalle?serviceRequest=${encodeURIComponent(parentProcess.serviceRequest)}`);
        } else {
            navigate('/apus');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-5xl mx-auto border border-base-200">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEditing ? `Editar Servicio (${editServiceId})` : 'Agregar Nuevo Servicio (APU)'}
                    </h1>
                    {parentProcess && (
                        <p className="text-sm text-base-content/70 mt-1">
                            Obra: <strong className="text-base-content">{parentProcess.serviceRequest}</strong> — {parentProcess.mainProcess} ({parentProcess.company?.name})
                        </p>
                    )}
                </div>
                <button type="button" onClick={goBack} className="btn btn-outline btn-sm">
                    Volver a la Obra
                </button>
            </div>

            {/* NOMBRE / DESCRIPCIÓN DEL SERVICIO */}
            <div className="mb-6">
                <div className="form-control">
                    <label className="label"><span className="label-text font-bold">Nombre / Descripción del Servicio*</span></label>
                    <input
                        id="input-description"
                        type="text"
                        name="description"
                        value={serviceData.description}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleEnterFocus(e, 'input-itemQuantity')}
                        className={`input input-bordered w-full ${getFieldHighlight('description')}`}
                        placeholder="Ej: Rebobinado de estator trifásico, Cambio de rodamientos..."
                        autoFocus
                        required
                    />
                </div>
            </div>

            {/* VARIABLES DE CÁLCULO */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="form-control">
                    <label className="label"><span className="label-text font-bold">Cantidad</span></label>
                    <input id="input-itemQuantity" type="number" name="itemQuantity" value={serviceData.itemQuantity} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-performance')} className={`input input-bordered ${getFieldHighlight('itemQuantity')}`} step="0.01" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-primary">Rendimiento*</span></label>
                    <input id="input-performance" type="number" name="performance" value={serviceData.performance} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-socialLawsPercentage')} className={`input input-bordered border-primary ${getFieldHighlight('performance')}`} step="0.01" required />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">% Leyes Soc.</span></label>
                    <input id="input-socialLawsPercentage" type="number" name="socialLawsPercentage" value={serviceData.socialLawsPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-adminPercentage')} className={`input input-bordered ${getFieldHighlight('socialLawsPercentage')}`} step="0.01" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">% Admin.</span></label>
                    <input id="input-adminPercentage" type="number" name="adminPercentage" value={serviceData.adminPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, 'input-utilityContingencyPercentage')} className={`input input-bordered ${getFieldHighlight('adminPercentage')}`} step="0.01" />
                </div>
                <div className="form-control">
                    <label className="label"><span className="label-text">% Utilidad</span></label>
                    <input id="input-utilityContingencyPercentage" type="number" name="utilityContingencyPercentage" value={serviceData.utilityContingencyPercentage} onChange={handleInputChange} onKeyDown={(e) => handleEnterFocus(e, materials.length > 0 ? 'input-material-id-0' : 'btn-add-material')} className={`input input-bordered ${getFieldHighlight('utilityContingencyPercentage')}`} step="0.01" />
                </div>
            </div>

            {/* LISTAS DE DETALLES */}
            <div ref={listsContainerRef} className="flex flex-col gap-6 mb-8 overflow-x-auto lg:overflow-visible">

                {/* MATERIALES */}
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>🔧</span> Materiales</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_80px_100px_100px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Unidad</div><div>Precio</div><div>Cantidad</div><div></div>
                    </div>
                    {materials.map((mat, index) => {
                        const isOpen = activeDropdown?.type === 'material' && activeDropdown.index === index;
                        const matches = isOpen ? getFilteredMaterials(mat.description || '') : [];
                        return (
                            <div key={`mat-${index}`} className={`grid grid-cols-[120px_minmax(150px,1fr)_80px_100px_100px_40px] gap-3 mb-2 items-center p-1 rounded ${mat.isNew && 'bg-warning/10 border border-warning/30'}`}>
                                <input
                                    id={`input-material-id-${index}`}
                                    type="text"
                                    className={`input input-sm input-bordered w-full ${getListHighlight(originalMaterials, index, 'materialId', mat.materialId)}`}
                                    value={mat.materialId}
                                    onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleMaterialAutoFill(index, e.currentTarget.value); } }}
                                    onBlur={(e) => handleMaterialAutoFill(index, e.target.value)}
                                    placeholder="ID"
                                />
                                <div className="relative">
                                    <input
                                        id={`input-material-desc-${index}`}
                                        type="text"
                                        className={`input input-sm input-bordered w-full ${getListHighlight(originalMaterials, index, 'description', mat.description)}`}
                                        value={mat.description}
                                        onChange={(e) => handleMaterialDescChange(index, e.target.value)}
                                        onFocus={() => {
                                            if ((mat.description || '').trim().length > 0 && !mat.materialId) {
                                                setActiveDropdown({ type: 'material', index });
                                            }
                                        }}
                                        onKeyDown={(e) => handleMaterialDescKeyDown(e, index)}
                                        placeholder="Buscar material..."
                                        autoComplete="off"
                                    />
                                    {isOpen && (
                                        <ul className="menu bg-base-100 rounded-box shadow-xl border border-base-300 absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto p-1">
                                            {matches.length > 0 ? (
                                                matches.map((item, mIdx) => (
                                                    <li key={item.id}>
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                selectMaterial(index, item);
                                                            }}
                                                            className={`flex justify-between items-center text-left w-full gap-2 ${mIdx === highlightedIndex ? 'active' : ''}`}
                                                        >
                                                            <span className="font-medium truncate">{item.description}</span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <span className="text-xs opacity-70">${item.baseCost.toFixed(2)}/{item.unit}</span>
                                                                <span className="badge badge-ghost badge-xs font-mono">{item.id}</span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="disabled">
                                                    <span className="text-xs text-base-content/60 py-2">
                                                        No hay materiales que empiecen por &ldquo;{(mat.description || '').trim()}&rdquo;
                                                        {!mat.isNew && ' — ingresa un ID para crearlo nuevo.'}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                <input id={`input-material-unit-${index}`} type="text" className={`input input-sm input-bordered w-full ${!mat.isNew && 'bg-base-200'}`} value={mat.unit} onChange={(e) => updateMaterial(index, 'unit', e.target.value)} disabled={!mat.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-material-price-${index}`)} />
                                <input id={`input-material-price-${index}`} type="number" className={`input input-sm input-bordered w-full ${!mat.isNew && 'bg-base-200'}`} value={mat.price} onChange={(e) => updateMaterial(index, 'price', e.target.value)} disabled={!mat.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-material-qty-${index}`)} />
                                <input id={`input-material-qty-${index}`} type="number" className={`input input-sm input-bordered w-full ${getListHighlight(originalMaterials, index, 'quantity', mat.quantity)}`} value={mat.quantity} onChange={(e) => updateMaterial(index, 'quantity', e.target.value)} onKeyDown={(e) => handleEnterFocus(e, index + 1 < materials.length ? `input-material-id-${index + 1}` : 'btn-add-material')} />
                                <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeMaterial(index)}>-</button>
                            </div>
                        );
                    })}
                    <button id="btn-add-material" type="button" onClick={addMaterial} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Material</button>
                </div>

                {/* EQUIPOS */}
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>⚙️</span> Equipos</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_100px_120px_100px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Precio Inicial</div><div>Factor Deprec.</div><div>Cantidad</div><div></div>
                    </div>
                    {equipments.map((eq, index) => {
                        const isOpen = activeDropdown?.type === 'equipment' && activeDropdown.index === index;
                        const matches = isOpen ? getFilteredEquipments(eq.description || '') : [];
                        return (
                            <div key={`eq-${index}`} className={`grid grid-cols-[120px_minmax(150px,1fr)_100px_120px_100px_40px] gap-3 mb-2 items-center p-1 rounded ${eq.isNew && 'bg-warning/10 border border-warning/30'}`}>
                                <input
                                    id={`input-equipment-id-${index}`}
                                    type="text"
                                    className={`input input-sm input-bordered w-full ${getListHighlight(originalEquipments, index, 'equipmentId', eq.equipmentId)}`}
                                    value={eq.equipmentId}
                                    onChange={(e) => updateEquipment(index, 'equipmentId', e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEquipmentAutoFill(index, e.currentTarget.value); } }}
                                    onBlur={(e) => handleEquipmentAutoFill(index, e.target.value)}
                                    placeholder="ID"
                                />
                                <div className="relative">
                                    <input
                                        id={`input-equipment-desc-${index}`}
                                        type="text"
                                        className={`input input-sm input-bordered w-full ${getListHighlight(originalEquipments, index, 'description', eq.description)}`}
                                        value={eq.description}
                                        onChange={(e) => handleEquipmentDescChange(index, e.target.value)}
                                        onFocus={() => {
                                            if ((eq.description || '').trim().length > 0 && !eq.equipmentId) {
                                                setActiveDropdown({ type: 'equipment', index });
                                            }
                                        }}
                                        onKeyDown={(e) => handleEquipmentDescKeyDown(e, index)}
                                        placeholder="Buscar equipo..."
                                        autoComplete="off"
                                    />
                                    {isOpen && (
                                        <ul className="menu bg-base-100 rounded-box shadow-xl border border-base-300 absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto p-1">
                                            {matches.length > 0 ? (
                                                matches.map((item, eIdx) => (
                                                    <li key={item.id}>
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                selectEquipment(index, item);
                                                            }}
                                                            className={`flex justify-between items-center text-left w-full gap-2 ${eIdx === highlightedIndex ? 'active' : ''}`}
                                                        >
                                                            <span className="font-medium truncate">{item.description}</span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <span className="text-xs opacity-70">${item.baseValue.toFixed(2)}</span>
                                                                <span className="badge badge-ghost badge-xs font-mono">{item.id}</span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="disabled">
                                                    <span className="text-xs text-base-content/60 py-2">
                                                        No hay equipos que empiecen por &ldquo;{(eq.description || '').trim()}&rdquo;
                                                        {!eq.isNew && ' — ingresa un ID para crearlo nuevo.'}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                <input id={`input-equipment-price-${index}`} type="number" step="any" className={`input input-sm input-bordered w-full ${!eq.isNew && 'bg-base-200'}`} value={eq.baseValue} onChange={(e) => updateEquipment(index, 'baseValue', e.target.value)} disabled={!eq.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-equipment-deprec-${index}`)} />
                                <input id={`input-equipment-deprec-${index}`} type="number" step="any" className={`input input-sm input-bordered w-full ${!eq.isNew && 'bg-base-200'}`} value={eq.depreciation} onChange={(e) => updateEquipment(index, 'depreciation', e.target.value)} disabled={!eq.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-equipment-qty-${index}`)} />
                                <input id={`input-equipment-qty-${index}`} type="number" className={`input input-sm input-bordered w-full ${getListHighlight(originalEquipments, index, 'quantity', eq.quantity)}`} value={eq.quantity} onChange={(e) => updateEquipment(index, 'quantity', e.target.value)} onKeyDown={(e) => handleEnterFocus(e, index + 1 < equipments.length ? `input-equipment-id-${index + 1}` : 'btn-add-equipment')} />
                                <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeEquipment(index)}>-</button>
                            </div>
                        );
                    })}
                    <button id="btn-add-equipment" type="button" onClick={addEquipment} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Equipo</button>
                </div>

                {/* MANO DE OBRA */}
                <div className="bg-base-200/50 border border-base-300 p-6 rounded-xl min-w-[700px]">
                    <h3 className="text-lg text-base-content font-medium mb-4 flex items-center gap-2"><span>👷</span> Mano de Obra</h3>
                    <div className="grid grid-cols-[120px_minmax(150px,1fr)_120px_120px_40px] gap-3 px-1 mb-2 text-sm font-semibold text-base-content/70">
                        <div>ID</div><div>Descripción</div><div>Salario diario</div><div>Dotación</div><div></div>
                    </div>
                    {labors.map((lab, index) => {
                        const isOpen = activeDropdown?.type === 'labor' && activeDropdown.index === index;
                        const matches = isOpen ? getFilteredLabors(lab.description || '') : [];
                        return (
                            <div key={`lab-${index}`} className={`grid grid-cols-[120px_minmax(150px,1fr)_120px_120px_40px] gap-3 mb-2 items-center p-1 rounded ${lab.isNew && 'bg-warning/10 border border-warning/30'}`}>
                                <input
                                    id={`input-labor-id-${index}`}
                                    type="text"
                                    className={`input input-sm input-bordered w-full ${getListHighlight(originalLabors, index, 'laborId', lab.laborId)}`}
                                    value={lab.laborId}
                                    onChange={(e) => updateLabor(index, 'laborId', e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLaborAutoFill(index, e.currentTarget.value); } }}
                                    onBlur={(e) => handleLaborAutoFill(index, e.target.value)}
                                    placeholder="ID"
                                />
                                <div className="relative">
                                    <input
                                        id={`input-labor-desc-${index}`}
                                        type="text"
                                        className={`input input-sm input-bordered w-full ${getListHighlight(originalLabors, index, 'description', lab.description)}`}
                                        value={lab.description}
                                        onChange={(e) => handleLaborDescChange(index, e.target.value)}
                                        onFocus={() => {
                                            if ((lab.description || '').trim().length > 0 && !lab.laborId) {
                                                setActiveDropdown({ type: 'labor', index });
                                            }
                                        }}
                                        onKeyDown={(e) => handleLaborDescKeyDown(e, index)}
                                        placeholder="Buscar cargo..."
                                        autoComplete="off"
                                    />
                                    {isOpen && (
                                        <ul className="menu bg-base-100 rounded-box shadow-xl border border-base-300 absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto p-1">
                                            {matches.length > 0 ? (
                                                matches.map((item, lIdx) => (
                                                    <li key={item.id}>
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                selectLabor(index, item);
                                                            }}
                                                            className={`flex justify-between items-center text-left w-full gap-2 ${lIdx === highlightedIndex ? 'active' : ''}`}
                                                        >
                                                            <span className="font-medium truncate">{item.description}</span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <span className="text-xs opacity-70">${item.baseDailyWage.toFixed(2)}/día</span>
                                                                <span className="badge badge-ghost badge-xs font-mono">{item.id}</span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="disabled">
                                                    <span className="text-xs text-base-content/60 py-2">
                                                        No hay cargos que empiecen por &ldquo;{(lab.description || '').trim()}&rdquo;
                                                        {!lab.isNew && ' — ingresa un ID para crearlo nuevo.'}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                <input id={`input-labor-wage-${index}`} type="number" className={`input input-sm input-bordered w-full ${!lab.isNew && 'bg-base-200'}`} value={lab.dailyWage} onChange={(e) => updateLabor(index, 'dailyWage', e.target.value)} disabled={!lab.isNew} onKeyDown={(e) => handleEnterFocus(e, `input-labor-qty-${index}`)} />
                                <input id={`input-labor-qty-${index}`} type="number" className={`input input-sm input-bordered w-full ${getListHighlight(originalLabors, index, 'dotation', lab.dotation)}`} value={lab.dotation} onChange={(e) => updateLabor(index, 'dotation', e.target.value)} onKeyDown={(e) => handleEnterFocus(e, index + 1 < labors.length ? `input-labor-id-${index + 1}` : 'btn-add-labor')} />
                                <button type="button" className="btn btn-sm btn-square btn-outline btn-error text-lg" onClick={() => removeLabor(index)}>-</button>
                            </div>
                        );
                    })}
                    <button id="btn-add-labor" type="button" onClick={addLabor} className="btn btn-sm btn-block btn-outline border-dashed text-base-content/60 hover:text-primary mt-2">+ Agregar Mano de Obra</button>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 border-t pt-6">
                <button type="button" onClick={goBack} className="btn btn-ghost" disabled={isSaving}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? <span className="loading loading-spinner"></span> : (isEditing ? 'Guardar Cambios' : 'Generar Servicio')}
                </button>
            </div>
        </div>
    );
}