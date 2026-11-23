import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { catalogService } from '../services/catalogServices';
import { apuService } from '../services/apuServices';
import { MOTOR_TYPE_OPTIONS } from '../utils/codificationUtils';
import type { Company, MotorType } from '../types';

const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function ProcessForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const editServiceRequest = searchParams.get('serviceRequest');
    const isEditing = Boolean(editServiceRequest);

    const [catalogCompanies, setCatalogCompanies] = useState<Company[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const companyDropdownRef = useRef<HTMLDivElement>(null);

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
        const fetchCompanies = async () => {
            try {
                const comps = await catalogService.getCompanies();
                setCatalogCompanies(comps);
            } catch (error) {
                console.error('Error cargando empresas:', error);
            }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
                setShowCompanyDropdown(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            } catch (err: any) {
                alert(err.response?.data?.message || 'Error al cargar el proceso para edición.');
                navigate('/apus');
            }
        };
        loadProcessToEdit();
    }, [editServiceRequest, navigate]);

    const normalizedNameQuery = normalizeText(header.companyName);
    const filteredCompanies = normalizedNameQuery
        ? catalogCompanies.filter((c) => normalizeText(c.name).startsWith(normalizedNameQuery))
        : [];

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
                brand: header.brand,
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
        } catch (error: any) {
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} proceso: ` + (error.response?.data?.message || 'Revisa los campos'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-4xl mx-auto border border-base-200">
            <h1 className="text-2xl font-bold mb-2">{isEditing ? 'Editar Proceso (Obra)' : 'Crear Nuevo Proceso (Obra)'}</h1>
            <p className="text-sm text-base-content/70 mb-6">
                Define la información general de la obra y especificaciones del equipo. Los servicios (APUs) se agregan dentro de la obra.
            </p>

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
                    <div className="form-control">
                        <label className="label"><span className="label-text">Serial</span></label>
                        <input
                            id="input-serial"
                            type="text"
                            name="serial"
                            value={header.serial}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleEnterFocus(e, 'input-brand')}
                            className={`input input-bordered input-sm ${getHeaderHighlight('serial')}`}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Marca</span></label>
                        <input
                            id="input-brand"
                            type="text"
                            name="brand"
                            value={header.brand}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleEnterFocus(e, 'input-location')}
                            className={`input input-bordered input-sm ${getHeaderHighlight('brand')}`}
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
