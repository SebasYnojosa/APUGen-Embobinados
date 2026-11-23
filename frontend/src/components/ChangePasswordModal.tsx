import { useState } from 'react';
import { isAxiosError } from 'axios';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
    isOpen: boolean;
    forced?: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ChangePasswordModal({
    isOpen,
    forced = false,
    onClose,
    onSuccess,
}: ChangePasswordModalProps) {
    const { updateUser, logout } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
    };

    const handleClose = () => {
        if (forced) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('La confirmación no coincide con la nueva contraseña.');
            return;
        }

        if (newPassword === currentPassword) {
            setError('La nueva contraseña debe ser diferente a la contraseña actual.');
            return;
        }

        try {
            setSubmitting(true);
            const updatedUser = await authService.changeOwnPassword({
                currentPassword,
                newPassword,
            });
            updateUser(updatedUser);
            resetForm();
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            if (isAxiosError<{ message?: string }>(err)) {
                setError(
                    err.response?.data?.message ||
                        'No se pudo actualizar la contraseña. Verifica tu contraseña actual.'
                );
            } else {
                setError('Ocurrió un error inesperado al cambiar la contraseña.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open" role="dialog" aria-modal="true">
            <div className="modal-box max-w-md">
                <h3 className="font-bold text-lg mb-2">Cambiar contraseña</h3>

                {forced && (
                    <div className="alert alert-warning py-2.5 mb-4 text-sm">
                        <span>
                            Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
                        </span>
                    </div>
                )}

                {error && (
                    <div className="alert alert-error py-2.5 mb-4 text-sm">
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="form-control">
                        <label className="label" htmlFor="cp-current-password">
                            <span className="label-text font-medium">Contraseña actual*</span>
                        </label>
                        <input
                            id="cp-current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="input input-bordered w-full"
                            autoComplete="current-password"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="cp-new-password">
                            <span className="label-text font-medium">Nueva contraseña*</span>
                        </label>
                        <input
                            id="cp-new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input input-bordered w-full"
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                        <label className="label">
                            <span className="label-text-alt text-base-content/60">
                                Mínimo 6 caracteres.
                            </span>
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="cp-confirm-password">
                            <span className="label-text font-medium">
                                Confirmar nueva contraseña*
                            </span>
                        </label>
                        <input
                            id="cp-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input input-bordered w-full"
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="modal-action mt-2">
                        {forced ? (
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={logout}
                                disabled={submitting}
                            >
                                Cerrar sesión
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn"
                                onClick={handleClose}
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    Guardando...
                                </>
                            ) : (
                                'Actualizar contraseña'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            {!forced && <div className="modal-backdrop" onClick={handleClose} />}
        </div>
    );
}
