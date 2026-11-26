import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { catalogService } from '../services/catalogServices';
import {
    CODIFICATION_TYPE_LABELS,
    CODIFICATION_TYPE_SHORT,
} from '../utils/codificationUtils';
import { formatDateTime } from '../utils/dateUtils';
import type { CatalogCodification, CodificationType } from '../types';

interface CodificationFormState {
    id: string;
    code: string;
    description: string;
    type: CodificationType;
}

const INITIAL_FORM: CodificationFormState = {
    id: '',
    code: '',
    description: '',
    type: 'mat',
};

const TYPE_BADGE_CLASS: Record<CodificationType, string> = {
    mat: 'badge-primary badge-outline',
    equ: 'badge-secondary badge-outline',
    mdo: 'badge-accent badge-outline',
};

const getErrorMessage = (err: unknown, fallback: string): string => {
    if (isAxiosError<{ message?: string }>(err)) {
        return err.response?.data?.message || fallback;
    }
    return fallback;
};

export default function CodificationManager() {
    const [codifications, setCodifications] = useState<CatalogCodification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | CodificationType>('all');

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [formState, setFormState] = useState<CodificationFormState>(INITIAL_FORM);
    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const codeInputRef = useRef<HTMLInputElement>(null);

    const fetchCodifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await catalogService.getCodifications();
            setCodifications(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al cargar las codificaciones desde el servidor.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCodifications();
    }, []);

    const openCreateModal = () => {
        setIsEditing(false);
        setModalError(null);
        setModalSuccess(null);
        setFormState({
            ...INITIAL_FORM,
            type: filterType === 'all' ? 'mat' : filterType,
        });
        setIsModalOpen(true);
        window.setTimeout(() => codeInputRef.current?.focus(), 40);
    };

    const openEditModal = (item: CatalogCodification) => {
        setIsEditing(true);
        setModalError(null);
        setModalSuccess(null);
        setFormState({
            id: item.id,
            code: item.code,
            description: item.description,
            type: item.type,
        });
        setIsModalOpen(true);
        window.setTimeout(() => codeInputRef.current?.focus(), 40);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalError(null);
        setModalSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setModalSuccess(null);
        setError(null);
        setSuccessMessage(null);

        const cleanCode = formState.code.trim().toUpperCase();
        const cleanDesc = formState.description.trim();

        if (cleanCode.length !== 3 || cleanCode.includes(' ')) {
            setModalError('El código debe tener exactamente 3 caracteres sin espacios (Ej: DES, BAR).');
            codeInputRef.current?.focus();
            return;
        }
        if (!cleanDesc) {
            setModalError('La descripción es obligatoria.');
            return;
        }

        try {
            setSubmitting(true);
            if (isEditing) {
                await catalogService.updateCodification(formState.id, {
                    code: cleanCode,
                    description: cleanDesc,
                    type: formState.type,
                });
                setSuccessMessage(`Codificación "${cleanCode}" actualizada exitosamente.`);
                await fetchCodifications();
                closeModal();
            } else {
                await catalogService.createCodification({
                    code: cleanCode,
                    description: cleanDesc,
                    type: formState.type,
                });
                await fetchCodifications();
                setModalSuccess(`¡Codificación "${cleanCode}" registrada! Puedes registrar otra.`);
                setFormState({
                    ...INITIAL_FORM,
                    type: filterType === 'all' ? formState.type : filterType,
                });
                window.setTimeout(() => codeInputRef.current?.focus(), 40);
            }
        } catch (err: unknown) {
            setModalError(getErrorMessage(err, 'Ocurrió un error al guardar la codificación.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item: CatalogCodification) => {
        if (!confirm(`¿Estás seguro de eliminar la codificación "${item.code}" (${item.description})?`)) {
            return;
        }
        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteCodification(item.id);
            setSuccessMessage(`Codificación "${item.code}" eliminada correctamente.`);
            await fetchCodifications();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'No se pudo eliminar la codificación.'));
        }
    };

    const visibleCodifications =
        filterType === 'all'
            ? codifications
            : codifications.filter((c) => c.type === filterType);

    return (
        <div className="p-4 sm:p-6 bg-base-100 rounded-box shadow max-w-7xl mx-auto border border-base-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold">Gestión de Codificaciones</h1>
                    <p className="text-sm text-base-content/70">
                        Administra los códigos de 3 caracteres para clasificar materiales, equipos y mano de obra.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm self-center sm:self-auto whitespace-nowrap w-48" onClick={openCreateModal}>
                    + Nueva Codificación
                </button>
            </div>

            {/* FILTRO POR TIPO DE CATÁLOGO */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                <button
                    type="button"
                    className={`btn btn-xs w-32 whitespace-nowrap ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFilterType('all')}
                >
                    Todas ({codifications.length})
                </button>
                {(['mat', 'equ', 'mdo'] as CodificationType[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`btn btn-xs w-32 whitespace-nowrap ${filterType === t ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilterType(t)}
                    >
                        {CODIFICATION_TYPE_SHORT[t]} (
                        {codifications.filter((c) => c.type === t).length})
                    </button>
                ))}
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

            {/* VISTA EN TARJETAS (< lg) */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-base-content/70">Cargando codificaciones...</div>
                ) : visibleCodifications.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">No hay codificaciones registradas.</div>
                ) : (
                    visibleCodifications.map((item) => (
                        <article
                            key={item.id}
                            className="p-4 rounded-box bg-base-200/40 border border-base-300 space-y-2.5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="badge badge-warning font-mono font-bold tracking-wider px-3 py-2.5">
                                    {item.code}
                                </span>
                                <span className={`badge badge-sm ${TYPE_BADGE_CLASS[item.type]}`}>
                                    {CODIFICATION_TYPE_LABELS[item.type]}
                                </span>
                            </div>

                            <p className="font-medium text-sm leading-snug break-words">
                                {item.description}
                            </p>

                            <div className="pt-2 border-t border-base-300/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="text-xs text-base-content/70 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span><span className="font-semibold">Creado:</span> {formatDateTime(item.createdAt)}</span>
                                    <span><span className="font-semibold">Act.:</span> {formatDateTime(item.updatedAt)}</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-outline btn-info whitespace-nowrap w-20"
                                        onClick={() => openEditModal(item)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-outline btn-error whitespace-nowrap w-20"
                                        onClick={() => handleDelete(item)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* VISTA EN TABLA (lg+) */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="table table-zebra table-sm w-full [&_th]:px-2.5 [&_td]:px-2.5">
                    <thead>
                        <tr>
                            <th className="whitespace-nowrap">Código</th>
                            <th>Descripción</th>
                            <th className="whitespace-nowrap">Tipo de Catálogo</th>
                            <th className="whitespace-nowrap">Fechas</th>
                            <th className="text-center whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6">
                                    Cargando codificaciones...
                                </td>
                            </tr>
                        ) : visibleCodifications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6">
                                    No hay codificaciones registradas.
                                </td>
                            </tr>
                        ) : (
                            visibleCodifications.map((item) => (
                                <tr key={item.id}>
                                    <td className="whitespace-nowrap">
                                        <span className="badge badge-warning font-mono font-bold tracking-wider px-3 py-2.5">
                                            {item.code}
                                        </span>
                                    </td>
                                    <td className="break-words">{item.description}</td>
                                    <td className="whitespace-nowrap">
                                        <span className={`badge badge-sm ${TYPE_BADGE_CLASS[item.type]}`}>
                                            {CODIFICATION_TYPE_LABELS[item.type]}
                                        </span>
                                    </td>
                                    <td className="text-xs text-base-content/70 whitespace-nowrap tabular-nums leading-tight">
                                        <div><span className="font-semibold">Creado:</span> {formatDateTime(item.createdAt)}</div>
                                        <div><span className="font-semibold">Act.:</span> {formatDateTime(item.updatedAt)}</div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline btn-info whitespace-nowrap w-20"
                                                onClick={() => openEditModal(item)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline btn-error whitespace-nowrap w-20"
                                                onClick={() => handleDelete(item)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR / EDITAR CODIFICACIÓN */}
            {isModalOpen && (
                <div className="modal modal-open z-40" role="dialog" aria-modal="true">
                    <div className="modal-box w-11/12 max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4">
                            {isEditing ? 'Editar Codificación' : 'Registrar Nueva Codificación'}
                        </h3>

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
                                <label className="label" htmlFor="codif-code">
                                    <span className="label-text font-medium">Código (3 caracteres)*</span>
                                </label>
                                <input
                                    ref={codeInputRef}
                                    id="codif-code"
                                    type="text"
                                    maxLength={3}
                                    value={formState.code}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            code: e.target.value.toUpperCase().replace(/\s/g, ''),
                                        }))
                                    }
                                    className="input input-bordered font-mono uppercase tracking-widest w-full"
                                    placeholder="Ej: DES, BAR"
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label" htmlFor="codif-desc">
                                    <span className="label-text font-medium">Descripción*</span>
                                </label>
                                <input
                                    id="codif-desc"
                                    type="text"
                                    value={formState.description}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="input input-bordered w-full"
                                    placeholder="Ej: Barnices y resinas aislantes"
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label" htmlFor="codif-type">
                                    <span className="label-text font-medium">Tipo de Catálogo*</span>
                                </label>
                                <select
                                    id="codif-type"
                                    value={formState.type}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            type: e.target.value as CodificationType,
                                        }))
                                    }
                                    className="select select-bordered w-full"
                                    disabled={submitting}
                                >
                                    <option value="mat">{CODIFICATION_TYPE_LABELS.mat}</option>
                                    <option value="equ">{CODIFICATION_TYPE_LABELS.equ}</option>
                                    <option value="mdo">{CODIFICATION_TYPE_LABELS.mdo}</option>
                                </select>
                            </div>

                            <div className="modal-action flex-wrap justify-center sm:justify-end gap-2 mt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-36"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? 'Guardando...'
                                        : isEditing
                                          ? 'Actualizar'
                                          : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    className="btn w-36"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={() => !submitting && closeModal()} />
                </div>
            )}
        </div>
    );
}
