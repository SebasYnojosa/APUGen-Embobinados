import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-primary" />
                    <p className="text-sm text-base-content/70 font-medium">
                        Verificando sesión...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
