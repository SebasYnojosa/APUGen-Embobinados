import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';

interface RedirectLocationState {
    from?: {
        pathname: string;
        search?: string;
        hash?: string;
    };
}

export default function LoginPage() {
    const { isAuthenticated, isLoading, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const state = location.state as RedirectLocationState | null;
    const from = state?.from;
    const redirectPath =
        from?.pathname && from.pathname !== '/login'
            ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
            : '/apus';

    const redirectedFromDeepLink = Boolean(
        from?.pathname && from.pathname !== '/' && from.pathname !== '/apus'
    );

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password) {
            setError('Ingresa tu usuario y contraseña.');
            return;
        }

        try {
            setSubmitting(true);
            await login({ username: trimmedUsername, password });
            navigate(redirectPath, { replace: true });
        } catch (err: unknown) {
            if (isAxiosError<{ message?: string }>(err)) {
                if (!err.response) {
                    setError(
                        'No se pudo conectar con el servidor. Verifica que el servicio esté activo.'
                    );
                } else {
                    setError(
                        err.response.data?.message || 'Usuario o contraseña incorrectos.'
                    );
                }
            } else {
                setError('Ocurrió un error inesperado al iniciar sesión.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
                <div className="card-body gap-5">
                    <div className="text-center space-y-1">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">APU Gen</h1>
                        <p className="text-sm text-base-content/70">
                            Sistema de Análisis de Precios Unitarios — Embobinados
                        </p>
                    </div>

                    {redirectedFromDeepLink && !error && (
                        <div className="alert alert-info py-2.5 text-sm">
                            <span>
                                Inicia sesión para acceder a la página solicitada.
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error py-2.5 text-sm">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label" htmlFor="login-username">
                                <span className="label-text font-medium">Usuario</span>
                            </label>
                            <input
                                id="login-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                className="input input-bordered w-full"
                                autoComplete="username"
                                autoFocus
                                required
                                disabled={submitting}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label" htmlFor="login-password">
                                <span className="label-text font-medium">Contraseña</span>
                            </label>
                            <div className="join w-full">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                    className="input input-bordered join-item w-full"
                                    autoComplete="current-password"
                                    required
                                    disabled={submitting}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline border-base-300 join-item px-3"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={
                                        showPassword
                                            ? 'Ocultar contraseña'
                                            : 'Mostrar contraseña'
                                    }
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar sesión'
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-center text-base-content/50">
                        Acceso exclusivo para personal autorizado. Si necesitas una cuenta,
                        solicítala al administrador.
                    </p>
                </div>
            </div>
        </div>
    );
}
