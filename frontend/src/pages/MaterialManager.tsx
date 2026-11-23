import { useEffect, useRef, useState } from 'react';
import { catalogService } from '../services/catalogServices';
import CodificationPickerModal from '../components/CodificationPickerModal';
import CreateCodificationModal from '../components/CreateCodificationModal';
import {
    applyCodificationToId,
    extractCodificationPrefix,
} from '../utils/codificationUtils';
import type { CatalogCodification, Material } from '../types';

interface MaterialFormState {
    id: string;
    description: string;
    unit: string;
    baseCost: string;
}

const INITIAL_FORM: MaterialFormState = {
    id: '',
    description: '',
    unit: '',
    baseCost: '',
};

export default function MaterialManager() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [codifications, setCodifications] = useState<CatalogCodification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentMaterial, setCurrentMaterial] = useState<MaterialFormState>(INITIAL_FORM);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // Sub-popups de codificaciones
    const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
    const [createCodifState, setCreateCodifState] = useState<{
        isOpen: boolean;
        initialCode: string;
    }>({ isOpen: false, initialCode: '' });

    const lastPromptedCodeRef = useRef<string | null>(null);
    const idInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLInputElement>(null);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getMaterials();
            setMaterials(data);
        } catch {
            setError('Error al cargar los materiales del servidor.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCodifications = async () => {
        try {
            const data = await catalogService.getCodifications();
            setCodifications(data);
        } catch {
            // No bloquea la pantalla principal si falla la precarga de codificaciones
        }
    };

    useEffect(() => {
        void fetchMaterials();
        void fetchCodifications();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentMaterial((prev) => ({ ...prev, [name]: value }));
    };

    const handleIdBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (isEditing) return;
        const related = e.relatedTarget as HTMLElement | null;
        if (related?.closest('[data-skip-codif-blur="true"]')) return;

        const prefix = extractCodificationPrefix(e.target.value);
        if (!prefix) return;

        const exists = codifications.some((c) => c.code.toUpperCase() === prefix);
        if (!exists && lastPromptedCodeRef.current !== prefix) {
            lastPromptedCodeRef.current = prefix;
            setCreateCodifState({ isOpen: true, initialCode: prefix });
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setModalError(null);
        setModalSuccess(null);
        lastPromptedCodeRef.current = null;
        setCurrentMaterial(INITIAL_FORM);
        setIsModalOpen(true);
        window.setTimeout(() => idInputRef.current?.focus(), 40);
    };

    const openEditModal = (mat: Material) => {
        setIsEditing(true);
        setModalError(null);
        setModalSuccess(null);
        lastPromptedCodeRef.current = null;
        setCurrentMaterial({
            id: mat.id,
            description: mat.description,
            unit: mat.unit,
            baseCost: String(mat.baseCost),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalError(null);
        setModalSuccess(null);
        lastPromptedCodeRef.current = null;
    };

    const handleSelectCodification = (codif: CatalogCodification) => {
        setCurrentMaterial((prev) => ({
            ...prev,
            id: applyCodificationToId(prev.id, codif.code),
        }));
        lastPromptedCodeRef.current = codif.code.toUpperCase();
        window.setTimeout(() => {
            const el = idInputRef.current;
            if (el) {
                el.focus();
                el.setSelectionRange(el.value.length, el.value.length);
            }
        }, 40);
    };

    const handleCodificationCreated = (created: CatalogCodification) => {
        setCodifications((prev) => [...prev, created]);
        lastPromptedCodeRef.current = created.code.toUpperCase();

        const currentTrimmed = currentMaterial.id.trim();
        const existingPrefix = extractCodificationPrefix(currentTrimmed);

        if (!currentTrimmed || !existingPrefix || existingPrefix !== created.code.toUpperCase()) {
            setCurrentMaterial((prev) => ({
                ...prev,
                id: applyCodificationToId(prev.id, created.code),
            }));
            window.setTimeout(() => {
                const el = idInputRef.current;
                if (el) {
                    el.focus();
                    el.setSelectionRange(el.value.length, el.value.length);
                }
            }, 40);
        } else if (currentTrimmed.length === 3) {
            setCurrentMaterial((prev) => ({ ...prev, id: `${created.code}-` }));
            window.setTimeout(() => {
                const el = idInputRef.current;
                if (el) {
                    el.focus();
                    el.setSelectionRange(el.value.length, el.value.length);
                }
            }, 40);
        } else {
            window.setTimeout(() => descInputRef.current?.focus(), 40);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setModalSuccess(null);

        const parsedCost = parseFloat(currentMaterial.baseCost);
        if (Number.isNaN(parsedCost) || parsedCost < 0) {
            setModalError('El costo base debe ser un número válido.');
            return;
        }

        const payload: Material = {
            id: currentMaterial.id.trim(),
            description: currentMaterial.description.trim(),
            unit: currentMaterial.unit.trim(),
            baseCost: parsedCost,
        };

        try {
            if (isEditing) {
                await catalogService.updateMaterial(payload.id, payload);
                setSuccessMessage('Material actualizado exitosamente.');
                await fetchMaterials();
                closeModal();
            } else {
                await catalogService.createMaterial(payload);
                await fetchMaterials();
                setModalSuccess(`¡Material ${payload.id} registrado! Puedes registrar otro.`);
                setCurrentMaterial(INITIAL_FORM);
                lastPromptedCodeRef.current = null;
                window.setTimeout(() => idInputRef.current?.focus(), 40);
            }
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el material con ID: ${id}?`)) return;
        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteMaterial(id);
            setSuccessMessage('Material eliminado correctamente.');
            await fetchMaterials();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el material porque está en uso.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Materiales</h1>
                    <p className="text-sm text-base-content/70">
                        Administra los insumos y costos base para los APUs.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                    + Nuevo Material
                </button>
            </div>

            {error && (
                <div className="alert alert-error mb-4 shadow-sm">
                    <span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="alert alert-success mb-4 shadow-sm">
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descripción</th>
                            <th>Unidad</th>
                            <th>Costo Base</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6">
                                    Cargando materiales...
                                </td>
                            </tr>
                        ) : materials.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6">
                                    No hay materiales registrados.
                                </td>
                            </tr>
                        ) : (
                            materials.map((mat) => (
                                <tr key={mat.id}>
                                    <td className="font-semibold">{mat.id}</td>
                                    <td>{mat.description}</td>
                                    <td>
                                        <span className="badge badge-ghost">{mat.unit}</span>
                                    </td>
                                    <td>${mat.baseCost.toFixed(2)}</td>
                                    <td className="text-center space-x-2">
                                        <button
                                            className="btn btn-xs btn-outline btn-info"
                                            onClick={() => openEditModal(mat)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn btn-xs btn-outline btn-error"
                                            onClick={() => handleDelete(mat.id)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR / EDITAR MATERIAL */}
            {isModalOpen && (
                <div className="modal modal-open z-40" role="dialog" aria-modal="true">
                    <div className="modal-box max-w-lg">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                            <h3 className="font-bold text-lg">
                                {isEditing ? 'Editar Material' : 'Registrar Nuevo Material'}
                            </h3>
                            {!isEditing && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        data-skip-codif-blur="true"
                                        className="btn btn-xs btn-warning"
                                        onClick={() => setIsPickerOpen(true)}
                                    >
                                        Usar codificación
                                    </button>
                                    <button
                                        type="button"
                                        data-skip-codif-blur="true"
                                        className="btn btn-xs btn-outline btn-primary"
                                        onClick={() =>
                                            setCreateCodifState({
                                                isOpen: true,
                                                initialCode:
                                                    extractCodificationPrefix(currentMaterial.id) ||
                                                    currentMaterial.id.trim().slice(0, 3),
                                            })
                                        }
                                    >
                                        + Codificación
                                    </button>
                                </div>
                            )}
                        </div>

                        {modalError && (
                            <div className="alert alert-error py-2 mb-4 text-sm shadow-sm">
                                <span>{modalError}</span>
                            </div>
                        )}
                        {modalSuccess && (
                            <div className="alert alert-success py-2 mb-4 text-sm shadow-sm">
                                <span>{modalSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">ID del Material*</span>
                                </label>
                                <input
                                    ref={idInputRef}
                                    id="input-mat-id"
                                    type="text"
                                    name="id"
                                    value={currentMaterial.id}
                                    onChange={handleInputChange}
                                    onBlur={handleIdBlur}
                                    className="input input-bordered"
                                    placeholder="Ej: MAT-001"
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Descripción*</span>
                                </label>
                                <input
                                    ref={descInputRef}
                                    type="text"
                                    name="description"
                                    value={currentMaterial.description}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="Ej: Alambre de Cobre esmaltado"
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Unidad de Medida*</span>
                                </label>
                                <input
                                    type="text"
                                    name="unit"
                                    value={currentMaterial.unit}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="Ej: kg, m, rollos"
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Costo Base*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="baseCost"
                                    value={currentMaterial.baseCost}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Actualizar' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    data-skip-codif-blur="true"
                                    className="btn"
                                    onClick={closeModal}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={closeModal} />
                </div>
            )}

            {/* POPUP SELECCIONAR CODIFICACIÓN */}
            <CodificationPickerModal
                isOpen={isPickerOpen}
                type="mat"
                codifications={codifications}
                onSelect={handleSelectCodification}
                onClose={() => setIsPickerOpen(false)}
                onRequestCreate={() =>
                    setCreateCodifState({
                        isOpen: true,
                        initialCode:
                            extractCodificationPrefix(currentMaterial.id) ||
                            currentMaterial.id.trim().slice(0, 3),
                    })
                }
            />

            {/* POPUP CREAR CODIFICACIÓN (TIPO BLOQUEADO A "mat") */}
            <CreateCodificationModal
                isOpen={createCodifState.isOpen}
                initialCode={createCodifState.initialCode}
                lockedType="mat"
                onClose={() => setCreateCodifState({ isOpen: false, initialCode: '' })}
                onCreated={handleCodificationCreated}
            />
        </div>
    );
}