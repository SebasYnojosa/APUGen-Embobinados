import { useEffect, useRef, useState } from 'react';
import { catalogService } from '../services/catalogServices';
import CodificationPickerModal from '../components/CodificationPickerModal';
import CreateCodificationModal from '../components/CreateCodificationModal';
import MotorTypeSelector from '../components/MotorTypeSelector';
import {
    ALL_MOTOR_TYPES,
    applyCodificationToId,
    extractCodificationPrefix,
    formatMotorType,
    parseParaTipoM,
    serializeParaTipoM,
} from '../utils/codificationUtils';
import type { CatalogCodification, Equipment, MotorType } from '../types';

interface EquipmentFormState {
    id: string;
    description: string;
    baseValue: string;
    depreciationFactor: string;
    paraTipoM: MotorType[];
}

const INITIAL_FORM: EquipmentFormState = {
    id: '',
    description: '',
    baseValue: '',
    depreciationFactor: '',
    paraTipoM: [],
};

export default function EquipmentManager() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [codifications, setCodifications] = useState<CatalogCodification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentEquipment, setCurrentEquipment] = useState<EquipmentFormState>(INITIAL_FORM);
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

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getEquipments();
            setEquipments(data);
        } catch {
            setError('Error al cargar los equipos del servidor.');
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
        void fetchEquipment();
        void fetchCodifications();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentEquipment((prev) => ({ ...prev, [name]: value }));
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
        setCurrentEquipment(INITIAL_FORM);
        setIsModalOpen(true);
        window.setTimeout(() => idInputRef.current?.focus(), 40);
    };

    const openEditModal = (equ: Equipment) => {
        setIsEditing(true);
        setModalError(null);
        setModalSuccess(null);
        lastPromptedCodeRef.current = null;
        setCurrentEquipment({
            id: equ.id,
            description: equ.description,
            baseValue: String(equ.baseValue),
            depreciationFactor: String(equ.depreciationFactor),
            paraTipoM: parseParaTipoM(equ.paraTipoM),
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
        setCurrentEquipment((prev) => ({
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

        const currentTrimmed = currentEquipment.id.trim();
        const existingPrefix = extractCodificationPrefix(currentTrimmed);

        if (!currentTrimmed || !existingPrefix || existingPrefix !== created.code.toUpperCase()) {
            setCurrentEquipment((prev) => ({
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
            setCurrentEquipment((prev) => ({ ...prev, id: `${created.code}-` }));
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

        const parsedBaseValue = parseFloat(currentEquipment.baseValue);
        const parsedDepreciation = parseFloat(currentEquipment.depreciationFactor);

        if (Number.isNaN(parsedBaseValue) || parsedBaseValue < 0) {
            setModalError('El precio base debe ser un número válido.');
            return;
        }

        if (Number.isNaN(parsedDepreciation) || parsedDepreciation === 0) {
            setModalError('El factor de depreciación no puede ser 0.');
            return;
        }

        if (parsedDepreciation < 0) {
            setModalError('El factor de depreciación debe ser mayor que 0.');
            return;
        }

        const payload: Equipment = {
            id: currentEquipment.id.trim(),
            description: currentEquipment.description.trim(),
            baseValue: parsedBaseValue,
            depreciationFactor: parsedDepreciation,
            paraTipoM: serializeParaTipoM(currentEquipment.paraTipoM),
        };

        try {
            if (isEditing) {
                await catalogService.updateEquipment(payload.id, payload);
                setSuccessMessage('Equipo actualizado exitosamente.');
                await fetchEquipment();
                closeModal();
            } else {
                await catalogService.createEquipment(payload);
                await fetchEquipment();
                setModalSuccess(`¡Equipo ${payload.id} registrado! Puedes registrar otro.`);
                setCurrentEquipment(INITIAL_FORM);
                lastPromptedCodeRef.current = null;
                window.setTimeout(() => idInputRef.current?.focus(), 40);
            }
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el equipo con ID: ${id}?`)) return;
        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteEquipment(id);
            setSuccessMessage('Equipo eliminado correctamente.');
            await fetchEquipment();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el equipo porque está en uso.');
        }
    };

    const renderMotorTypeBadges = (paraTipoM?: string) => {
        const parsed = parseParaTipoM(paraTipoM);
        if (parsed.length === ALL_MOTOR_TYPES.length) {
            return <span className="badge badge-success badge-outline badge-sm">Todos</span>;
        }
        return (
            <div className="flex flex-wrap gap-1">
                {parsed.map((t) => (
                    <span key={t} className="badge badge-info badge-outline badge-sm">
                        {formatMotorType(t)}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
                    <p className="text-sm text-base-content/70">
                        Administra los equipos, precios base y factores de depreciación para los APUs.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                    + Nuevo Equipo
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
                            <th>Precio Base</th>
                            <th>F. Depreciación</th>
                            <th>Tipo de Motor</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    Cargando equipos...
                                </td>
                            </tr>
                        ) : equipments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    No hay equipos registrados.
                                </td>
                            </tr>
                        ) : (
                            equipments.map((equ) => (
                                <tr key={equ.id}>
                                    <td className="font-semibold">{equ.id}</td>
                                    <td>{equ.description}</td>
                                    <td>
                                        <span className="badge badge-ghost">
                                            {equ.baseValue.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>{equ.depreciationFactor.toFixed(6)}</td>
                                    <td>{renderMotorTypeBadges(equ.paraTipoM)}</td>
                                    <td className="text-center space-x-2">
                                        <button
                                            className="btn btn-xs btn-outline btn-info"
                                            onClick={() => openEditModal(equ)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn btn-xs btn-outline btn-error"
                                            onClick={() => handleDelete(equ.id)}
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

            {/* MODAL CREAR / EDITAR EQUIPO */}
            {isModalOpen && (
                <div className="modal modal-open z-40" role="dialog" aria-modal="true">
                    <div className="modal-box max-w-lg">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                            <h3 className="font-bold text-lg">
                                {isEditing ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
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
                                                    extractCodificationPrefix(currentEquipment.id) ||
                                                    currentEquipment.id.trim().slice(0, 3),
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
                                    <span className="label-text">ID del Equipo*</span>
                                </label>
                                <input
                                    ref={idInputRef}
                                    id="input-equ-id"
                                    type="text"
                                    name="id"
                                    value={currentEquipment.id}
                                    onChange={handleInputChange}
                                    onBlur={handleIdBlur}
                                    className="input input-bordered"
                                    placeholder="Ej: EQU-001"
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
                                    value={currentEquipment.description}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="Ej: Barnizadora"
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Precio Base*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="baseValue"
                                    value={currentEquipment.baseValue}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">F. Depreciación*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="depreciationFactor"
                                    value={currentEquipment.depreciationFactor}
                                    onChange={handleInputChange}
                                    className="input input-bordered"
                                    placeholder="0.000000"
                                    required
                                />
                            </div>
                            <MotorTypeSelector
                                value={currentEquipment.paraTipoM}
                                onChange={(next) =>
                                    setCurrentEquipment((prev) => ({ ...prev, paraTipoM: next }))
                                }
                            />
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
                type="equ"
                codifications={codifications}
                onSelect={handleSelectCodification}
                onClose={() => setIsPickerOpen(false)}
                onRequestCreate={() =>
                    setCreateCodifState({
                        isOpen: true,
                        initialCode:
                            extractCodificationPrefix(currentEquipment.id) ||
                            currentEquipment.id.trim().slice(0, 3),
                    })
                }
            />

            {/* POPUP CREAR CODIFICACIÓN (TIPO BLOQUEADO A "equ") */}
            <CreateCodificationModal
                isOpen={createCodifState.isOpen}
                initialCode={createCodifState.initialCode}
                lockedType="equ"
                onClose={() => setCreateCodifState({ isOpen: false, initialCode: '' })}
                onCreated={handleCodificationCreated}
            />
        </div>
    );
}