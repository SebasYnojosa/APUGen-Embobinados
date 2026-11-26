import { useState, useEffect, useRef, useCallback } from 'react';
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
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    buttonClassName?: string;
}

export default function QuickBrandButton({
    existingBrands,
    onBrandCreated,
    isOpen: controlledOpen,
    onOpenChange,
    buttonClassName = '',
}: QuickBrandButtonProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const onOpenChangeRef = useRef(onOpenChange);
    const isOpenRef = useRef(isOpen);
    const isCreatingRef = useRef(isCreating);
    const pointerDownRef = useRef(false);
    const pendingBlurCloseRef = useRef(false);
    const closeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        onOpenChangeRef.current = onOpenChange;
    }, [onOpenChange]);

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        isCreatingRef.current = isCreating;
    }, [isCreating]);

    const setOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInternalOpen(next);
            }
            onOpenChangeRef.current?.(next);
        },
        [isControlled]
    );

    const handleCancel = useCallback(() => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        pendingBlurCloseRef.current = false;
        setBrandName('');
        setError(null);
        setOpen(false);
    }, [setOpen]);

    useEffect(() => {
        if (!isOpen) {
            pointerDownRef.current = false;
            pendingBlurCloseRef.current = false;
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
            return;
        }

        inputRef.current?.focus();

        const handlePointerDown = () => {
            pointerDownRef.current = true;
        };

        const handlePointerUp = () => {
            pointerDownRef.current = false;
            if (!pendingBlurCloseRef.current) return;
            pendingBlurCloseRef.current = false;
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
            }
            closeTimerRef.current = window.setTimeout(() => {
                closeTimerRef.current = null;
                if (!isOpenRef.current || isCreatingRef.current) return;
                if (containerRef.current?.contains(document.activeElement)) return;
                handleCancel();
            }, 0);
        };

        window.addEventListener('pointerdown', handlePointerDown, true);
        window.addEventListener('pointerup', handlePointerUp, true);
        window.addEventListener('pointercancel', handlePointerUp, true);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown, true);
            window.removeEventListener('pointerup', handlePointerUp, true);
            window.removeEventListener('pointercancel', handlePointerUp, true);
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, [isOpen, handleCancel]);

    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => setSuccess(null), 4000);
        return () => clearTimeout(timer);
    }, [success]);

    const handleOpen = () => {
        setBrandName('');
        setError(null);
        setSuccess(null);
        setOpen(true);
    };

    const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!isOpen || isCreating) return;
        const nextFocused = e.relatedTarget as Node | null;
        if (nextFocused && containerRef.current?.contains(nextFocused)) {
            return;
        }
        if (pointerDownRef.current) {
            pendingBlurCloseRef.current = true;
            return;
        }
        handleCancel();
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
            setOpen(false);
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
        <div
            ref={containerRef}
            onBlur={handleContainerBlur}
            className="relative flex flex-col items-center lg:items-end min-w-0 max-w-full min-h-[4.5rem] lg:min-h-0"
        >
            <div className="flex flex-col-reverse items-center gap-2 lg:flex-row lg:items-center lg:justify-end">
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
                        readOnly={isCreating}
                        className={`input input-bordered input-sm w-48 ${
                            error ? 'input-error' : ''
                        }`}
                    />
                )}
                <button
                    type="button"
                    onMouseDown={(e) => {
                        if (isOpen) {
                            e.preventDefault();
                        }
                    }}
                    onClick={isOpen ? () => void handleCreate() : handleOpen}
                    disabled={isCreating}
                    className={`btn btn-sm whitespace-nowrap ${
                        isOpen ? 'btn-primary' : 'btn-outline btn-primary'
                    } ${buttonClassName}`.trim()}
                >
                    {isCreating ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : isOpen ? (
                        'Ingresar Marca'
                    ) : (
                        '+ Nueva Marca'
                    )}
                </button>
            </div>
            {isOpen && error && (
                <p className="text-error text-xs mt-1 max-w-48 lg:max-w-xs text-center lg:text-right break-words max-lg:absolute max-lg:top-full max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:z-20 max-lg:w-48 max-lg:bg-base-100 max-lg:px-2 max-lg:py-1 max-lg:rounded-md max-lg:shadow-md max-lg:border max-lg:border-error/30">
                    {error}
                </p>
            )}
            {success && (
                <p className="text-success text-xs mt-1 max-w-48 lg:max-w-xs text-center lg:text-right break-words max-lg:absolute max-lg:top-full max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:z-20 max-lg:w-48 max-lg:bg-base-100 max-lg:px-2 max-lg:py-1 max-lg:rounded-md max-lg:shadow-md max-lg:border max-lg:border-success/30">
                    {success}
                </p>
            )}
        </div>
    );
}
