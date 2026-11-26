import { useEffect, useState } from 'react';
import { CODIFICATION_TYPE_SHORT } from '../utils/codificationUtils';
import type { CatalogCodification, CodificationType } from '../types';

interface CodificationPickerModalProps {
    isOpen: boolean;
    type: CodificationType;
    codifications: CatalogCodification[];
    onSelect: (codification: CatalogCodification) => void;
    onClose: () => void;
    onRequestCreate?: () => void;
}

export default function CodificationPickerModal({
    isOpen,
    type,
    codifications,
    onSelect,
    onClose,
    onRequestCreate,
}: CodificationPickerModalProps) {
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const query = search.trim().toLowerCase();
    const filtered = codifications
        .filter((c) => c.type === type)
        .filter(
            (c) =>
                !query ||
                c.code.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query)
        );

    return (
        <div className="modal modal-open z-[65]" role="dialog" aria-modal="true">
            <div className="modal-box w-11/12 max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5 mb-4">
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg break-words">
                            Seleccionar Codificación — {CODIFICATION_TYPE_SHORT[type]}
                        </h3>
                        <p className="text-xs text-base-content/70">
                            Elige una codificación existente para insertarla en el campo de ID.
                        </p>
                    </div>
                    {onRequestCreate && (
                        <button
                            type="button"
                            className="btn btn-xs btn-outline btn-primary self-center sm:self-auto whitespace-nowrap w-32 shrink-0"
                            onClick={() => {
                                onClose();
                                onRequestCreate();
                            }}
                        >
                            + Nueva
                        </button>
                    )}
                </div>

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar por código o descripción..."
                    className="input input-bordered input-sm w-full mb-3"
                    autoFocus
                />

                <div className="max-h-64 sm:max-h-72 overflow-y-auto border border-base-300 rounded-box divide-y divide-base-200">
                    {filtered.length === 0 ? (
                        <div className="p-6 text-center text-sm text-base-content/60">
                            No hay codificaciones registradas para{' '}
                            <strong>{CODIFICATION_TYPE_SHORT[type]}</strong>
                            {query && ' con ese filtro'}.
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                                className="w-full text-left px-3.5 sm:px-4 py-3 hover:bg-base-200 transition-colors flex items-center gap-3"
                            >
                                <span className="badge badge-warning font-mono font-bold tracking-wider px-3 py-2.5 shrink-0">
                                    {item.code}
                                </span>
                                <span className="text-sm leading-snug break-words min-w-0">{item.description}</span>
                            </button>
                        ))
                    )}
                </div>

                <div className="modal-action flex-wrap justify-center sm:justify-end mt-4">
                    <button type="button" className="btn btn-sm whitespace-nowrap w-36" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </div>
    );
}
