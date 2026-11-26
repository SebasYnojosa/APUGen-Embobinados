import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { catalogService } from '../services/catalogServices';
import { CODIFICATION_TYPE_LABELS } from '../utils/codificationUtils';
import type { CatalogCodification, CodificationType } from '../types';

interface CreateCodificationModalProps {
    isOpen: boolean;
    initialCode?: string;
    lockedType?: CodificationType;
    onClose: () => void;
    onCreated: (created: CatalogCodification) => void;
}

export default function CreateCodificationModal({
    isOpen,
    initialCode = '',
    lockedType,
    onClose,
    onCreated,
}: CreateCodificationModalProps) {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<CodificationType>(lockedType || 'mat');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const codeInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const normalizedInitial = initialCode.trim().toUpperCase().slice(0, 3);
        setCode(normalizedInitial);
        setDescription('');
        setType(lockedType || 'mat');
        setError(null);

        const timer = window.setTimeout(() => {
            if (normalizedInitial.length === 3) {
                descInputRef.current?.focus();
            } else {
                codeInputRef.current?.focus();
            }
        }, 40);

        return () => window.clearTimeout(timer);
    }, [isOpen, initialCode, lockedType]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !submitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, submitting, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanCode = code.trim().toUpperCase();
        const cleanDesc = description.trim();
        const finalType = lockedType || type;

        if (cleanCode.length !== 3 || cleanCode.includes(' ')) {
            setError('El código debe tener exactamente 3 caracteres sin espacios (Ej: DES, BAR).');
            codeInputRef.current?.focus();
            return;
        }

        if (!cleanDesc) {
            setError('La descripción es obligatoria.');
            descInputRef.current?.focus();
            return;
        }

        try {
            setSubmitting(true);
            const created = await catalogService.createCodification({
                code: cleanCode,
                description: cleanDesc,
                type: finalType,
            });
            onCreated(created);
            onClose();
        } catch (err: unknown) {
            if (isAxiosError<{ message?: string }>(err)) {
                setError(err.response?.data?.message || 'No se pudo guardar la codificación.');
            } else {
                setError('Ocurrió un error inesperado al guardar la codificación.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open z-[70]" role="dialog" aria-modal="true">
            <div className="modal-box w-11/12 max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-1">Nueva Codificación</h3>
                <p className="text-xs text-base-content/70 mb-4">
                    Registra un código de 3 caracteres para reutilizarlo en los IDs del catálogo.
                </p>

                {error && (
                    <div className="alert alert-error py-2 mb-4 text-sm shadow-sm">
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="form-control">
                        <label className="label" htmlFor="codif-modal-code">
                            <span className="label-text font-medium">Código (3 caracteres)*</span>
                        </label>
                        <input
                            ref={codeInputRef}
                            id="codif-modal-code"
                            type="text"
                            maxLength={3}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                            placeholder="Ej: DES, BAR"
                            className="input input-bordered font-mono uppercase tracking-widest w-full"
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="codif-modal-desc">
                            <span className="label-text font-medium">Descripción (en qué casos se usa)*</span>
                        </label>
                        <input
                            ref={descInputRef}
                            id="codif-modal-desc"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Barnices y resinas de impregnación"
                            className="input input-bordered w-full"
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="codif-modal-type">
                            <span className="label-text font-medium">Tipo de Catálogo*</span>
                        </label>
                        <select
                            id="codif-modal-type"
                            value={lockedType || type}
                            onChange={(e) => setType(e.target.value as CodificationType)}
                            className="select select-bordered w-full"
                            disabled={Boolean(lockedType) || submitting}
                        >
                            <option value="mat">{CODIFICATION_TYPE_LABELS.mat}</option>
                            <option value="equ">{CODIFICATION_TYPE_LABELS.equ}</option>
                            <option value="mdo">{CODIFICATION_TYPE_LABELS.mdo}</option>
                        </select>
                        {lockedType && (
                            <label className="label py-1">
                                <span className="label-text-alt text-base-content/60">
                                    Bloqueado al catálogo actual.
                                </span>
                            </label>
                        )}
                    </div>

                    <div className="modal-action flex-wrap justify-center sm:justify-end gap-2 mt-2">
                        <button
                            type="button"
                            className="btn whitespace-nowrap w-36"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary whitespace-nowrap w-36"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    Guardando...
                                </>
                            ) : (
                                'Aceptar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={() => !submitting && onClose()} />
        </div>
    );
}
