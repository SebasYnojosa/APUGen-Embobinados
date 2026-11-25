import { useState, useEffect, useRef } from 'react';
import { catalogService } from '../services/catalogServices';
import type { Brand } from '../types';

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

interface QuickBrandButtonProps {
    existingBrands?: Brand[];
    onBrandCreated?: (brand: Brand) => void;
}

export default function QuickBrandButton({
    existingBrands,
    onBrandCreated,
}: QuickBrandButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => setSuccess(null), 4000);
        return () => clearTimeout(timer);
    }, [success]);

    const handleOpen = () => {
        setIsOpen(true);
        setError(null);
        setSuccess(null);
    };

    const handleCancel = () => {
        setIsOpen(false);
        setBrandName('');
        setError(null);
    };

    const handleCreate = async () => {
        const trimmed = brandName.trim();
        if (!trimmed) {
            setError('Ingresa el nombre de la marca.');
            inputRef.current?.focus();
            return;
        }

        if (existingBrands) {
            const existing = existingBrands.find(
                (b) => normalizeText(b.name) === normalizeText(trimmed)
            );
            if (existing) {
                setError(`Ya existe una marca registrada con el nombre "${existing.name}".`);
                inputRef.current?.focus();
                return;
            }
        }

        try {
            setIsCreating(true);
            setError(null);
            const created = await catalogService.createBrand({ name: trimmed });
            onBrandCreated?.(created);
            setBrandName('');
            setIsOpen(false);
            setSuccess(`Marca "${created.name}" creada correctamente.`);
        } catch (err: unknown) {
            setError(
                extractApiErrorMessage(err, 'No se pudo crear la marca. Verifica que no exista.')
            );
            inputRef.current?.focus();
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col items-start sm:items-end shrink-0">
            <div className="flex items-center gap-2">
                {isOpen && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={brandName}
                        onChange={(e) => {
                            setBrandName(e.target.value);
                            if (error) setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleCreate();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancel();
                            }
                        }}
                        placeholder="Nombre de la marca..."
                        maxLength={100}
                        disabled={isCreating}
                        className={`input input-bordered input-sm w-44 sm:w-52 ${
                            error ? 'input-error' : ''
                        }`}
                    />
                )}
                <button
                    type="button"
                    onClick={isOpen ? () => void handleCreate() : handleOpen}
                    disabled={isCreating}
                    className={`btn btn-sm whitespace-nowrap ${
                        isOpen ? 'btn-primary' : 'btn-outline btn-primary'
                    }`}
                >
                    {isCreating ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : isOpen ? (
                        'Ingresar Marca'
                    ) : (
                        '+ Nueva Marca'
                    )}
                </button>
                {isOpen && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isCreating}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Cancelar"
                        aria-label="Cancelar creación de marca"
                    >
                        ✕
                    </button>
                )}
            </div>
            {error && (
                <p className="text-error text-xs mt-1 max-w-xs sm:text-right">
                    {error}
                </p>
            )}
            {success && (
                <p className="text-success text-xs mt-1 max-w-xs sm:text-right">
                    {success}
                </p>
            )}
        </div>
    );
}
