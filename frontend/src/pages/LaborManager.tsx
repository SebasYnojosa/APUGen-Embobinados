import { useEffect, useRef, useState } from 'react';
import { catalogService } from '../services/catalogServices';
import CodificationPickerModal from '../components/CodificationPickerModal';
import CreateCodificationModal from '../components/CreateCodificationModal';
import {
    applyCodificationToId,
    extractCodificationPrefix,
} from '../utils/codificationUtils';
import type { CatalogCodification, Labor } from '../types';

interface LaborFormState {
    id: string;
    description: string;
    baseDailyWage: string;
}

const INITIAL_FORM: LaborFormState = {
    id: '',
    description: '',
    baseDailyWage: '',
};

export default function LaborManager() {
    const [labors, setLabor] = useState<Labor[]>([]);
    const [codifications, setCodifications] = useState<CatalogCodification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentLabor, setCurrentLabor] = useState<LaborFormState>(INITIAL_FORM);
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

    const fetchLabor = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getLabors();
            setLabor(data);
        } catch {
            setError('Error al cargar los cargos desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCodifications = async () => {
        try {
            const data = await catalogService.getCodifications();
            setCodifications(data);
        } catch {
            // No bloquea la pantalla principal si falla la precarga
        }
    };

    useEffect(() => {
        void fetchLabor();
        void fetchCodifications();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentLabor((prev) => ({ ...prev, [name]: value }));
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
        setCurrentLabor(INITIAL_FORM);
        setIsModalOpen(true);
        window.setTimeout(() => idInputRef.current?.focus(), 40);
    };

    const openEditModal = (lab: Labor) => {
        setIsEditing(true);
        setModalError(null);
        setModalSuccess(null);
        lastPromptedCodeRef.current = null;
        setCurrentLabor({
            id: lab.id,
            description: lab.description,
            baseDailyWage: String(lab.baseDailyWage),
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
        setCurrentLabor((prev) => ({
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

        const currentTrimmed = currentLabor.id.trim();
        const existingPrefix = extractCodificationPrefix(currentTrimmed);

        if (!currentTrimmed || !existingPrefix || existingPrefix !== created.code.toUpperCase()) {
            setCurrentLabor((prev) => ({
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
            setCurrentLabor((prev) => ({ ...prev, id: `${created.code}-` }));
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

        const parsedWage = parseFloat(currentLabor.baseDailyWage);
        if (Number.isNaN(parsedWage) || parsedWage < 0) {
            setModalError('El salario diario debe ser un número válido.');
            return;
        }

        const payload: Labor = {
            id: currentLabor.id.trim(),
            description: currentLabor.description.trim(),
            baseDailyWage: parsedWage,
        };

        try {
            if (isEditing) {
                await catalogService.updateLabor(payload.id, payload);
                setSuccessMessage('Cargo actualizado exitosamente.');
                await fetchLabor();
                closeModal();
            } else {
                await catalogService.createLabor(payload);
                await fetchLabor();
                setModalSuccess(`¡Cargo ${payload.id} registrado! Puedes registrar otro.`);
                setCurrentLabor(INITIAL_FORM);
                lastPromptedCodeRef.current = null;
                window.setTimeout(() => idInputRef.current?.focus(), 40);
            }
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Error al guardar el cargo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de eliminar el cargo con ID: ${id}?`)) return;
        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteLabor(id);
            setSuccessMessage('Cargo eliminado correctamente.');
            await fetchLabor();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el cargo porque está en uso.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Cargos</h1>
                    <p className="text-sm text-base-content/70">
                        Administra a los trabajadores y sus salarios diarios.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                    + Nuevo Cargo
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
                            <th>Salario Diario</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-6">
                                    Cargando cargos...
                                </td>
                            </tr>
                        ) : labors.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-6">
                                    No hay cargos registrados.
                                </td>
                            </tr>
                        ) : (
                            labors.map((lab) => (
                                <tr key={lab.id}>
                                    <td className="font-semibold">{lab.id}</td>
                                    <td>{lab.description}</td>
                                    <td>${lab.baseDailyWage.toFixed(2)}</td>
                                    <td className="text-center space-x-2">
                                        <button
                                            className="btn btn-xs btn-outline btn-info"
                                            onClick={() => openEditModal(lab)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn btn-xs btn-outline btn-error"
                                            onClick={() => handleDelete(lab.id)}
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

            {/* MODAL CREAR / EDITAR CARGO */}
            {isModalOpen && (
                <div className="modal modal-open z-40" role="dialog" aria-modal="true">
                    <div className="modal-box max-w-lg">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                            <h3 className="font-bold text-lg">
                                {isEditing ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}
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
                                                    extractCodificationPrefix(currentLabor.id) ||
                                                    currentLabor.id.trim().slice(0, 3),
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
                                    <span className="label-text">ID del Cargo*</span>
                                </label>
                                <input
                                    ref={idInputRef}
                                    id="input-lab-id"
                                    type="text"
                                    name="id"
                                    value={currentLabor.id}
                                    onChange={handleInputChange}
                                    onBlur={handleIdBlur}
                                    className="input input-bordered"
                                    placeholder="Ej: MDO-001"
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
                                    value={currentLabor.description}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="Ej: Ingeniero"
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Salario Diario*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="baseDailyWage"
                                    value={currentLabor.baseDailyWage}
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
                type="mdo"
                codifications={codifications}
                onSelect={handleSelectCodification}
                onClose={() => setIsPickerOpen(false)}
                onRequestCreate={() =>
                    setCreateCodifState({
                        isOpen: true,
                        initialCode:
                            extractCodificationPrefix(currentLabor.id) ||
                            currentLabor.id.trim().slice(0, 3),
                    })
                }
            />

            {/* POPUP CREAR CODIFICACIÓN (TIPO BLOQUEADO A "mdo") */}
            <CreateCodificationModal
                isOpen={createCodifState.isOpen}
                initialCode={createCodifState.initialCode}
                lockedType="mdo"
                onClose={() => setCreateCodifState({ isOpen: false, initialCode: '' })}
                onCreated={handleCodificationCreated}
            />
        </div>
    );
}