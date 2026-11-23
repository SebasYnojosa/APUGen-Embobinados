import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import type { AuthUser, UserRole } from '../types';

interface UserFormState {
    id: string;
    username: string;
    fullName: string;
    password: string;
    role: UserRole;
    mustChangePassword: boolean;
}

const INITIAL_FORM: UserFormState = {
    id: '',
    username: '',
    fullName: '',
    password: '',
    role: 'USER',
    mustChangePassword: true,
};

const getErrorMessage = (err: unknown, fallback: string): string => {
    if (isAxiosError<{ message?: string }>(err)) {
        return err.response?.data?.message || fallback;
    }
    return fallback;
};

const formatCreatedAt = (isoDate?: string): string => {
    if (!isoDate) return '—';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
};

export default function UserManager() {
    const { user: currentUser, updateUser } = useAuth();

    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal Crear / Editar usuario
    const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [formState, setFormState] = useState<UserFormState>(INITIAL_FORM);
    const [modalError, setModalError] = useState<string | null>(null);
    const [submittingUser, setSubmittingUser] = useState<boolean>(false);

    // Modal Resetear contraseña
    const [resetTarget, setResetTarget] = useState<AuthUser | null>(null);
    const [resetPasswordValue, setResetPasswordValue] = useState<string>('');
    const [resetMustChange, setResetMustChange] = useState<boolean>(true);
    const [resetError, setResetError] = useState<string | null>(null);
    const [submittingReset, setSubmittingReset] = useState<boolean>(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al cargar los usuarios desde el servidor.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchUsers();
    }, []);

    const openCreateModal = () => {
        setIsEditing(false);
        setFormState(INITIAL_FORM);
        setModalError(null);
        setIsUserModalOpen(true);
    };

    const openEditModal = (target: AuthUser) => {
        setIsEditing(true);
        setFormState({
            id: target.id,
            username: target.username,
            fullName: target.fullName,
            password: '',
            role: target.role,
            mustChangePassword: target.mustChangePassword,
        });
        setModalError(null);
        setIsUserModalOpen(true);
    };

    const closeUserModal = () => {
        setIsUserModalOpen(false);
        setModalError(null);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setError(null);
        setSuccessMessage(null);

        if (!isEditing && formState.password.length < 6) {
            setModalError('La contraseña temporal debe tener al menos 6 caracteres.');
            return;
        }

        try {
            setSubmittingUser(true);
            if (isEditing) {
                const updated = await userService.updateUser(formState.id, {
                    fullName: formState.fullName.trim(),
                    role: formState.role,
                });
                if (currentUser && updated.id === currentUser.id) {
                    updateUser(updated);
                }
                setSuccessMessage(`Usuario "${updated.username}" actualizado correctamente.`);
            } else {
                const created = await userService.createUser({
                    username: formState.username.trim(),
                    fullName: formState.fullName.trim(),
                    password: formState.password,
                    role: formState.role,
                    mustChangePassword: formState.mustChangePassword,
                });
                setSuccessMessage(`Usuario "${created.username}" creado exitosamente.`);
            }

            await fetchUsers();
            closeUserModal();
        } catch (err: unknown) {
            setModalError(getErrorMessage(err, 'No se pudo guardar el usuario.'));
        } finally {
            setSubmittingUser(false);
        }
    };

    const handleToggleStatus = async (target: AuthUser) => {
        const nextActive = !target.active;
        const actionLabel = nextActive ? 'activar' : 'desactivar';
        if (
            !confirm(
                `¿Estás seguro de ${actionLabel} al usuario "${target.username}" (${target.fullName})?`
            )
        ) {
            return;
        }

        setError(null);
        setSuccessMessage(null);

        try {
            const updated = await userService.updateUserStatus(target.id, nextActive);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setSuccessMessage(
                `Usuario "${updated.username}" ${nextActive ? 'activado' : 'desactivado'} correctamente.`
            );
        } catch (err: unknown) {
            setError(getErrorMessage(err, `No se pudo ${actionLabel} el usuario.`));
        }
    };

    const openResetModal = (target: AuthUser) => {
        setResetTarget(target);
        setResetPasswordValue('');
        setResetMustChange(true);
        setResetError(null);
    };

    const closeResetModal = () => {
        setResetTarget(null);
        setResetPasswordValue('');
        setResetError(null);
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetTarget) return;

        setResetError(null);
        setError(null);
        setSuccessMessage(null);

        if (resetPasswordValue.length < 6) {
            setResetError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            setSubmittingReset(true);
            const updated = await userService.resetPassword(resetTarget.id, {
                newPassword: resetPasswordValue,
                mustChangePassword: resetMustChange,
            });
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            if (currentUser && updated.id === currentUser.id) {
                updateUser(updated);
            }
            setSuccessMessage(
                `Contraseña de "${updated.username}" restablecida correctamente.`
            );
            closeResetModal();
        } catch (err: unknown) {
            setResetError(getErrorMessage(err, 'No se pudo restablecer la contraseña.'));
        } finally {
            setSubmittingReset(false);
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-sm text-base-content/70">
                        Administra las cuentas con acceso al sistema APU Gen.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                    + Nuevo Usuario
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
                            <th>Usuario</th>
                            <th>Nombre Completo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Creado</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    Cargando usuarios...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6">
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => {
                                const isSelf = currentUser?.id === u.id;
                                return (
                                    <tr key={u.id}>
                                        <td className="font-semibold">
                                            <div className="flex items-center gap-2">
                                                <span>{u.username}</span>
                                                {isSelf && (
                                                    <span className="badge badge-xs badge-info badge-outline">
                                                        Tú
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{u.fullName}</td>
                                        <td>
                                            <span
                                                className={`badge badge-sm ${
                                                    u.role === 'ADMIN'
                                                        ? 'badge-primary'
                                                        : 'badge-ghost'
                                                }`}
                                            >
                                                {u.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={`badge badge-sm ${
                                                        u.active
                                                            ? 'badge-success badge-outline'
                                                            : 'badge-error badge-outline'
                                                    }`}
                                                >
                                                    {u.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                                {u.mustChangePassword && (
                                                    <span className="badge badge-sm badge-warning badge-outline">
                                                        Cambio pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-sm text-base-content/70">
                                            {formatCreatedAt(u.createdAt)}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex flex-wrap justify-center gap-1.5">
                                                <button
                                                    className="btn btn-xs btn-outline btn-info"
                                                    onClick={() => openEditModal(u)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline btn-warning"
                                                    onClick={() => openResetModal(u)}
                                                >
                                                    Resetear clave
                                                </button>
                                                <button
                                                    className={`btn btn-xs btn-outline ${
                                                        u.active ? 'btn-error' : 'btn-success'
                                                    }`}
                                                    disabled={isSelf}
                                                    title={
                                                        isSelf
                                                            ? 'No puedes desactivar tu propia cuenta'
                                                            : undefined
                                                    }
                                                    onClick={() => handleToggleStatus(u)}
                                                >
                                                    {u.active ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR / EDITAR USUARIO */}
            {isUserModalOpen && (
                <div className="modal modal-open" role="dialog" aria-modal="true">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-lg mb-4">
                            {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                        </h3>

                        {modalError && (
                            <div className="alert alert-error py-2 mb-4 text-sm shadow-sm">
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleUserSubmit} className="flex flex-col gap-4">
                            <div className="form-control">
                                <label className="label" htmlFor="user-username">
                                    <span className="label-text font-medium">Usuario*</span>
                                </label>
                                <input
                                    id="user-username"
                                    type="text"
                                    value={formState.username}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            username: e.target.value,
                                        }))
                                    }
                                    placeholder="ej. jperez"
                                    className="input input-bordered w-full"
                                    required
                                    disabled={isEditing || submittingUser}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label" htmlFor="user-fullname">
                                    <span className="label-text font-medium">
                                        Nombre completo*
                                    </span>
                                </label>
                                <input
                                    id="user-fullname"
                                    type="text"
                                    value={formState.fullName}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            fullName: e.target.value,
                                        }))
                                    }
                                    placeholder="ej. Juan Pérez"
                                    className="input input-bordered w-full"
                                    required
                                    disabled={submittingUser}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label" htmlFor="user-role">
                                    <span className="label-text font-medium">Rol*</span>
                                </label>
                                <select
                                    id="user-role"
                                    value={formState.role}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            role: e.target.value as UserRole,
                                        }))
                                    }
                                    className="select select-bordered w-full"
                                    disabled={submittingUser}
                                >
                                    <option value="USER">Usuario estándar</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>

                            {!isEditing && (
                                <>
                                    <div className="form-control">
                                        <label className="label" htmlFor="user-password">
                                            <span className="label-text font-medium">
                                                Contraseña temporal*
                                            </span>
                                        </label>
                                        <input
                                            id="user-password"
                                            type="password"
                                            value={formState.password}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    password: e.target.value,
                                                }))
                                            }
                                            placeholder="Mínimo 6 caracteres"
                                            className="input input-bordered w-full"
                                            minLength={6}
                                            required
                                            disabled={submittingUser}
                                        />
                                    </div>

                                    <label className="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary checkbox-sm"
                                            checked={formState.mustChangePassword}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    mustChangePassword: e.target.checked,
                                                }))
                                            }
                                            disabled={submittingUser}
                                        />
                                        <span className="label-text text-sm">
                                            Exigir cambio de contraseña en el primer ingreso
                                        </span>
                                    </label>
                                </>
                            )}

                            <div className="modal-action mt-2">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={closeUserModal}
                                    disabled={submittingUser}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submittingUser}
                                >
                                    {submittingUser ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs" />
                                            Guardando...
                                        </>
                                    ) : isEditing ? (
                                        'Actualizar'
                                    ) : (
                                        'Crear usuario'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={closeUserModal} />
                </div>
            )}

            {/* MODAL RESETEAR CONTRASEÑA */}
            {resetTarget && (
                <div className="modal modal-open" role="dialog" aria-modal="true">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-lg mb-1">Resetear contraseña</h3>
                        <p className="text-sm text-base-content/70 mb-4">
                            Establece una nueva contraseña para{' '}
                            <span className="font-semibold">{resetTarget.fullName}</span> (
                            <code>{resetTarget.username}</code>).
                        </p>

                        {resetError && (
                            <div className="alert alert-error py-2 mb-4 text-sm shadow-sm">
                                <span>{resetError}</span>
                            </div>
                        )}

                        <form
                            onSubmit={handleResetPasswordSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="form-control">
                                <label className="label" htmlFor="reset-new-password">
                                    <span className="label-text font-medium">
                                        Nueva contraseña temporal*
                                    </span>
                                </label>
                                <input
                                    id="reset-new-password"
                                    type="password"
                                    value={resetPasswordValue}
                                    onChange={(e) => setResetPasswordValue(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="input input-bordered w-full"
                                    minLength={6}
                                    required
                                    autoFocus
                                    disabled={submittingReset}
                                />
                            </div>

                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={resetMustChange}
                                    onChange={(e) => setResetMustChange(e.target.checked)}
                                    disabled={submittingReset}
                                />
                                <span className="label-text text-sm">
                                    Exigir cambio de contraseña al iniciar sesión
                                </span>
                            </label>

                            <div className="modal-action mt-2">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={closeResetModal}
                                    disabled={submittingReset}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-warning"
                                    disabled={submittingReset}
                                >
                                    {submittingReset ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs" />
                                            Actualizando...
                                        </>
                                    ) : (
                                        'Restablecer contraseña'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={closeResetModal} />
                </div>
            )}
        </div>
    );
}
