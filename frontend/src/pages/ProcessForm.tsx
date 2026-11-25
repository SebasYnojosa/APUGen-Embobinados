import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { catalogService } from '../services/catalogServices';
import { apuService } from '../services/apuServices';
import { MOTOR_TYPE_OPTIONS } from '../utils/codificationUtils';
import type { Brand, Company, MotorType } from '../types';

const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
    if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
            return response.data.message;
        }
    }
    return fallback;
};

export default function ProcessForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const editServiceRequest = searchParams.get('serviceRequest');
    const isEditing = Boolean(editServiceRequest);

    const [catalogCompanies, setCatalogCompanies] = useState<Company[]>([]);
    const [catalogBrands, setCatalogBrands] = useState<Brand[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const companyDropdownRef = useRef<HTMLDivElement>(null);

    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [brandHighlightedIndex, setBrandHighlightedIndex] = useState(-1);
    const brandDropdownRef = useRef<HTMLDivElement>(null);

    const [isQuickBrandOpen, setIsQuickBrandOpen] = useState(false);
    const [quickBrandName, setQuickBrandName] = useState('');
    const [quickBrandError, setQuickBrandError] = useState<string | null>(null);
    const [quickBrandSuccess, setQuickBrandSuccess] = useState<string | null>(null);
    const [isCreatingBrand, setIsCreatingBrand] = useState(false);
    const quickBrandInputRef = useRef<HTMLInputElement>(null);

    const [header, setHeader] = useState({
        serviceRequest: '',
        companyId: '',
        companyName: '',
        isNewCompany: false,
        mainProcess: '',
        power: '',
        tipoM: '' as MotorType | '',
        serial: '',
        brand: '',
        location: '',
    });

    const [originalHeader, setOriginalHeader] = useState<typeof header | null>(null);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [comps, brands] = await Promise.all([
                    catalogService.getCompanies(),
                    catalogService.getBrands(),
                ]);
                setCatalogCompanies(comps);
                setCatalogBrands(brands);
            } catch (error) {
                console.error('Error cargando catálogos:', error);
            }
        };
        fetchCatalogs();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(target)) {
                setShowCompanyDropdown(false);
                setHighlightedIndex(-1);
            }
            if (brandDropdownRef.current && !brandDropdownRef.current.contains(target)) {
                setShowBrandDropdown(false);
                setBrandHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isQuickBrandOpen) {
            quickBrandInputRef.current?.focus();
        }
    }, [isQuickBrandOpen]);

    useEffect(() => {
        if (!quickBrandSuccess) return;
        const timer = setTimeout(() => setQuickBrandSuccess(null), 4000);
        return () => clearTimeout(timer);
    }, [quickBrandSuccess]);

    useEffect(() => {
        if (!editServiceRequest) return;

        const loadProcessToEdit = async () => {
            try {
                const data = await apuService.getProcessByServiceRequest(editServiceRequest);
                const p = data.process;

                const loaded = {
                    serviceRequest: p.serviceRequest,
                    companyId: p.company?.id || '',
                    companyName: p.company?.name || '',
                    isNewCompany: false,
                    mainProcess: p.mainProcess,
                    power: p.power || '',
                    tipoM: (p.tipoM || '') as MotorType | '',
                    serial: p.serial || '',
                    brand: p.brand || '',
                    location: p.location || '',
                };

                setHeader(loaded);
                setOriginalHeader(loaded);
            } catch (err: unknown) {
                alert(extractApiErrorMessage(err, 'Error al cargar el proceso para edición.'));
                navigate('/apus');
            }
        };
        loadProcessToEdit();
    }, [editServiceRequest, navigate]);

    const normalizedNameQuery = normalizeText(header.companyName);
    const filteredCompanies = normalizedNameQuery
        ? catalogCompanies.filter((c) => normalizeText(c.name).startsWith(normalizedNameQuery))
        : [];

    const normalizedBrandQuery = normalizeText(header.brand);
    const filteredBrands = normalizedBrandQuery
        ? catalogBrands
            .filter((b) => normalizeText(b.name).includes(normalizedBrandQuery))
            .sort((a, b) => {
                const aStarts = normalizeText(a.name).startsWith(normalizedBrandQuery) ? 0 : 1;
                const bStarts = normalizeText(b.name).startsWith(normalizedBrandQuery) ? 0 : 1;
                if (aStarts !== bStarts) return aStarts - bStarts;
                return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
            })
        : catalogBrands;

    const hasExactBrandMatch =
        normalizedBrandQuery.length > 0 &&
        catalogBrands.some((b) => normalizeText(b.name) === normalizedBrandQuery);
    const isNewBrandTyped = normalizedBrandQuery.length > 0 && !hasExactBrandMatch;

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

    const selectCompany = (comp: Company) => {
        setHeader(prev => ({
            ...prev,
            companyId: comp.id,
            companyName: comp.name,
            isNewCompany: false,
        }));
        setShowCompanyDropdown(false);
        setHighlightedIndex(-1);
        focusElement('input-power');
    };

    const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHeader(prev => {
            if (prev.isNewCompany) {
                return { ...prev, companyName: value };
            }
            return { ...prev, companyName: value, companyId: '', isNewCompany: false };
        });

        const hasQuery = value.trim().length > 0;
        setShowCompanyDropdown(hasQuery);
        setHighlightedIndex(-1);
    };

    const handleCompanyNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showCompanyDropdown && filteredCompanies.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % filteredCompanies.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev <= 0 ? filteredCompanies.length - 1 : prev - 1));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredCompanies.length) {
                    selectCompany(filteredCompanies[highlightedIndex]);
                } else if (!header.isNewCompany && filteredCompanies.length === 1) {
                    selectCompany(filteredCompanies[0]);
                } else {
                    setShowCompanyDropdown(false);
                    focusElement('input-power');
                }
                return;
            }
            if (e.key === 'Escape') {
                setShowCompanyDropdown(false);
                setHighlightedIndex(-1);
                return;
            }
        }

        handleEnterFocus(e, 'input-power');
    };

    const handleCompanyAutoFill = (idToSearch: string) => {
        const trimmed = idToSearch.trim();
        if (!trimmed) return;
        const found = catalogCompanies.find(c => c.id.toLowerCase() === trimmed.toLowerCase());
        if (found) {
            setHeader(prev => ({ ...prev, companyId: found.id, companyName: found.name, isNewCompany: false }));
            setShowCompanyDropdown(false);
            setHighlightedIndex(-1);
            focusElement('input-power');
        } else {
            setHeader(prev => {
                const nameBelongsToExisting = catalogCompanies.some(
                    c => normalizeText(c.name) === normalizeText(prev.companyName)
                );
                return {
                    ...prev,
                    companyName: nameBelongsToExisting ? '' : prev.companyName,
                    isNewCompany: true,
                };
            });
            focusElement('input-companyName');
        }
    };

    const selectBrand = (brand: Brand) => {
        setHeader(prev => ({ ...prev, brand: brand.name }));
        setShowBrandDropdown(false);
        setBrandHighlightedIndex(-1);
        focusElement('input-serial');
    };

    const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeader(prev => ({ ...prev, brand: e.target.value }));
        setShowBrandDropdown(true);
        setBrandHighlightedIndex(-1);
    };

    const handleBrandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!showBrandDropdown) {
                setShowBrandDropdown(true);
            }
            if (filteredBrands.length > 0) {
                setBrandHighlightedIndex(prev => (prev + 1) % filteredBrands.length);
            }
            return;
        }
        if (e.key === 'ArrowUp' && showBrandDropdown && filteredBrands.length > 0) {
            e.preventDefault();
            setBrandHighlightedIndex(prev => (prev <= 0 ? filteredBrands.length - 1 : prev - 1));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (
                showBrandDropdown &&
                brandHighlightedIndex >= 0 &&
                brandHighlightedIndex < filteredBrands.length
            ) {
                selectBrand(filteredBrands[brandHighlightedIndex]);
            } else {
                setShowBrandDropdown(false);
                setBrandHighlightedIndex(-1);
                focusElement('input-serial');
            }
            return;
        }
        if (e.key === 'Escape') {
            setShowBrandDropdown(false);
            setBrandHighlightedIndex(-1);
        }
    };

    const handleOpenQuickBrand = () => {
        setIsQuickBrandOpen(true);
        setQuickBrandError(null);
        setQuickBrandSuccess(null);
    };

    const handleCancelQuickBrand = () => {
        setIsQuickBrandOpen(false);
        setQuickBrandName('');
        setQuickBrandError(null);
    };

    const handleQuickCreateBrand = async () => {
        const trimmed = quickBrandName.trim();
        if (!trimmed) {
            setQuickBrandError('Ingresa el nombre de la marca.');
            quickBrandInputRef.current?.focus();
            return;
        }

        const existing = catalogBrands.find(
            (b) => normalizeText(b.name) === normalizeText(trimmed)
        );
        if (existing) {
            setQuickBrandError(`Ya existe una marca registrada con el nombre "${existing.name}".`);
            quickBrandInputRef.current?.focus();
            return;
        }

        try {
            setIsCreatingBrand(true);
            setQuickBrandError(null);
            const created = await catalogService.createBrand({ name: trimmed });
            setCatalogBrands((prev) =>
                [...prev, created].sort((a, b) =>
                    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
                )
            );
            setQuickBrandName('');
            setIsQuickBrandOpen(false);
            setQuickBrandSuccess(`Marca "${created.name}" creada correctamente.`);
        } catch (err: unknown) {
            setQuickBrandError(
                extractApiErrorMessage(err, 'No se pudo crear la marca. Verifica que no exista.')
            );
            quickBrandInputRef.current?.focus();
        } finally {
            setIsCreatingBrand(false);
        }
    };

    const getHeaderHighlight = (field: keyof typeof header) => {
        if (!isEditing || !originalHeader) return '';
        return String(header[field]) !== String(originalHeader[field])
            ? 'bg-warning/20 border-warning'
            : '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!header.companyId.trim()) {
            alert('Selecciona una empresa del listado o ingresa un ID de empresa para crear una nueva.');
            focusElement('input-companyId');
            return;
        }
        try {
            setIsSaving(true);

            if (header.isNewCompany) {
                await catalogService.createCompany({
                    id: header.companyId.trim(),
                    name: header.companyName.trim(),
                });
            }

            const processDTO = {
                serviceRequest: header.serviceRequest.trim(),
                companyId: header.companyId.trim(),
                mainProcess: header.mainProcess.trim(),
                power: header.power,
                tipoM: header.tipoM,
                serial: header.serial,
                brand: header.brand.trim(),
                location: header.location,
            };

            if (isEditing && editServiceRequest) {
                await apuService.updateProcess(editServiceRequest, processDTO);
                alert(`Proceso ${editServiceRequest} actualizado correctamente.`);
                navigate(`/apus/detalle?serviceRequest=${encodeURIComponent(editServiceRequest)}`);
            } else {
                const created = await apuService.createProcess(processDTO);
                alert(`Proceso ${created.serviceRequest} creado. Ahora puedes agregar sus servicios.`);
                navigate(`/apus/detalle?serviceRequest=${encodeURIComponent(created.serviceRequest)}`);
            }
        } catch (error: unknown) {
            alert(
                `Error al ${isEditing ? 'actualizar' : 'crear'} proceso: ` +
                extractApiErrorMessage(error, 'Revisa los campos')
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-4xl mx-auto border border-base-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">
                        {isEditing ? 'Editar Proceso (Obra)' : 'Crear Nuevo Proceso (Obra)'}
                    </h1>
                    <p className="text-sm text-base-content/70">
                        Define la información general de la obra y especificaciones del equipo. Los servicios (APUs) se agregan dentro de la obra.
                    </p>
                </div>

                {/* BOTÓN ESQUINA: CREACIÓN RÁPIDA DE MARCA */}
                <div className="flex flex-col items-start sm:items-end shrink-0">
                    <div className="flex items-center gap-2">
                        {isQuickBrandOpen && (
                            <input
                                ref={quickBrandInputRef}
                                type="text"
                                value={quickBrandName}
                                onChange={(e) => {
                                    setQuickBrandName(e.target.value);
                                    if (quickBrandError) setQuickBrandError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void handleQuickCreateBrand();
                                    } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        handleCancelQuickBrand();
                                    }
                                }}
                                placeholder="Nombre de la marca..."
                                maxLength={100}
                                disabled={isCreatingBrand}
                                className={`input input-bordered input-sm w-44 sm:w-52 ${
                                    quickBrandError ? 'input-error' : ''
                                }`}
                            />
                        )}
                        <button
                            type="button"
                            onClick={
                                isQuickBrandOpen ? () => void handleQuickCreateBrand() : handleOpenQuickBrand
                            }
                            disabled={isCreatingBrand}
                            className={`btn btn-sm ${
                                isQuickBrandOpen ? 'btn-primary' : 'btn-outline btn-primary'
                            }`}
                        >
                            {isCreatingBrand ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : isQuickBrandOpen ? (
                                'Ingresar Marca'
                            ) : (
                                '+ Nueva Marca'
                            )}
                        </button>
                        {isQuickBrandOpen && (
                            <button
                                type="button"
                                onClick={handleCancelQuickBrand}
                                disabled={isCreatingBrand}
                                className="btn btn-ghost btn-sm btn-square"
                                title="Cancelar"
                                aria-label="Cancelar creación de marca"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {quickBrandError && (
                        <p className="text-error text-xs mt-1 max-w-xs sm:text-right">
                            {quickBrandError}
                        </p>
                    )}
                    {quickBrandSuccess && (
                        <p className="text-success text-xs mt-1 max-w-xs sm:text-right">
                            {quickBrandSuccess}
                        </p>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* CABECERA */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 border-b pb-6">
                    <div className="form-control md:col-span-1">
                        <label className="label"><span className="label-text font-bold">Solicitud (ID)*</span></label>
                        <input
                            id="input-serviceRequest"
                            type="text"
                            name="serviceRequest"
                            value={header.serviceRequest}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleEnterFocus(e, 'input-mainProcess')}
                            className="input input-bordered w-full"
                            placeholder="Ej: SR-2026-001"
                            required
                            autoFocus={!isEditing}
                            disabled={isEditing}
                        />
                    </div>
                    <div className="form-control md:col-span-3">
                        <label className="label"><span className="label-text font-bold">Proceso Principal*</span></label>
                        <input
                            id="input-mainProcess"
                            type="text"
                            name="mainProcess"
                            value={header.mainProcess}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleEnterFocus(e, 'input-companyId')}
                            className={`input input-bordered w-full ${getHeaderHighlight('mainProcess')}`}
                            placeholder="Ej: Rebobinado y Mantenimiento General Motor 50HP"
                            required
                        />
                    </div>

                    <div className="form-control md:col-span-1">
                        <label className="label"><span className="label-text font-bold">Empresa (ID)*</span></label>
                        <input
                            id="input-companyId"
                            type="text"
                            name="companyId"
                            value={header.companyId}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCompanyAutoFill(e.currentTarget.value);
                                }
                            }}
                            onBlur={(e) => handleCompanyAutoFill(e.target.value)}
                            className={`input input-bordered w-full ${getHeaderHighlight('companyId')}`}
                            placeholder="Ej: EMP-001"
                            required
                        />
                    </div>
                    <div className="form-control md:col-span-3 relative" ref={companyDropdownRef}>
                        <label className="label">
                            <span className="label-text font-bold">
                                Nombre de la Empresa {header.isNewCompany && <span className="text-error ml-2">(Creando Nueva)</span>}
                            </span>
                        </label>
                        <input
                            id="input-companyName"
                            type="text"
                            name="companyName"
                            value={header.companyName}
                            onChange={handleCompanyNameChange}
                            onFocus={() => {
                                if (header.companyName.trim().length > 0 && !header.companyId) {
                                    setShowCompanyDropdown(true);
                                }
                            }}
                            onKeyDown={handleCompanyNameKeyDown}
                            className={`input input-bordered w-full ${getHeaderHighlight('companyName')}`}
                            placeholder="Buscar empresa por nombre..."
                            autoComplete="off"
                            required
                        />

                        {showCompanyDropdown && (
                            <ul className="menu bg-base-100 rounded-box shadow-xl border border-base-300 absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto p-1">
                                {filteredCompanies.length > 0 ? (
                                    filteredCompanies.map((comp, idx) => (
                                        <li key={comp.id}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectCompany(comp);
                                                }}
                                                className={`flex justify-between items-center text-left w-full ${
                                                    idx === highlightedIndex ? 'active' : ''
                                                }`}
                                            >
                                                <span className="font-medium">{comp.name}</span>
                                                <span className="badge badge-ghost badge-sm font-mono">{comp.id}</span>
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li className="disabled">
                                        <span className="text-xs text-base-content/60 py-2">
                                            No hay empresas que empiecen por &ldquo;{header.companyName.trim()}&rdquo;
                                            {!header.isNewCompany && ' — ingresa un ID para crearla nueva.'}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ESPECIFICACIONES DEL EQUIPO */}
                <h2 className="text-lg font-semibold mb-3">Especificaciones del Equipo</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Potencia</span></label>
                        <input
                            id="input-power"
                            type="text"
                            name="power"
                            value={header.power}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleEnterFocus(e, 'input-tipoM')}
                            className={`input input-bordered input-sm ${getHeaderHighlight('power')}`}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Tipo de Motor</span></label>
                        <select
                            id="input-tipoM"
                            name="tipoM"
                            value={header.tipoM}
                            onChange={handleInputChange}
                            className={`select select-bordered select-sm w-full ${getHeaderHighlight('tipoM')}`}
                        >
                            <option value="">Seleccionar...</option>
                            {MOTOR_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control relative" ref={brandDropdownRef}>
                        <label className="label">
                            <span className="label-text">
                                Marca
                                {isNewBrandTyped && (
                                    <span className="text-info text-xs font-semibold ml-1.5">(Nueva)</span>
                                )}
                            </span>
                        </label>
                        <input
                            id="input-brand"
                            type="text"
                            name="brand"
                            value={header.brand}
                            onChange={handleBrandChange}
                            onFocus={() => setShowBrandDropdown(true)}
                            onKeyDown={handleBrandKeyDown}
                            placeholder="Buscar o escribir marca..."
                            autoComplete="off"
                            maxLength={100}
                            className={`input input-bordered input-sm w-full ${getHeaderHighlight('brand')}`}
                        />

                        {showBrandDropdown && (
                            <ul className="menu bg-base-100 rounded-box shadow-xl border border-base-300 absolute left-0 right-0 top-full mt-1 z-50 max-h-52 overflow-y-auto p-1">
                                {filteredBrands.length > 0 ? (
                                    filteredBrands.map((brand, idx) => (
                                        <li key={brand.id}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectBrand(brand);
                                                }}
                                                className={`text-left w-full text-sm ${
                                                    idx === brandHighlightedIndex ? 'active' : ''
                                                }`}
                                            >
                                                {brand.name}
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li className="disabled">
                                        <span className="text-xs text-base-content/60 py-2">
                                            {normalizedBrandQuery
                                                ? `Sin coincidencias para "${header.brand.trim()}"`
                                                : 'No hay marcas registradas aún.'}
                                        </span>
                                    </li>
                                )}
                                {isNewBrandTyped && (
                                    <li className="disabled border-t border-base-200 mt-1 pt-1">
                                        <span className="text-xs text-info py-1">
                                            Se creará &ldquo;{header.brand.trim()}&rdquo; al guardar la obra
                                        </span>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Serial</span></label>
                        <input
                            id="input-serial"
                            type="text"
                            name="serial"
                            value={header.serial}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleEnterFocus(e, 'input-location')}
                            className={`input input-bordered input-sm ${getHeaderHighlight('serial')}`}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Ubicación</span></label>
                        <input
                            id="input-location"
                            type="text"
                            name="location"
                            value={header.location}
                            onChange={handleInputChange}
                            className={`input input-bordered input-sm ${getHeaderHighlight('location')}`}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                    <button
                        type="button"
                        onClick={() =>
                            isEditing && editServiceRequest
                                ? navigate(`/apus/detalle?serviceRequest=${encodeURIComponent(editServiceRequest)}`)
                                : navigate('/apus')
                        }
                        className="btn btn-ghost"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <span className="loading loading-spinner"></span> : (isEditing ? 'Guardar Cambios' : 'Crear Proceso')}
                    </button>
                </div>
            </form>
        </div>
    );
}
