import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import ApuList from './pages/ApuList';
import ProcessForm from './pages/ProcessForm';
import ProcessDetail from './pages/ProcessDetail';
import ApuForm from './pages/ApuForm';
import ApuDetail from './pages/ApuDetail';
import MaterialManager from './pages/MaterialManager';
import CompanyManager from './pages/CompanyManager';
import EquipmentManager from './pages/EquipmentManager';
import LaborManager from './pages/LaborManager';
import CodificationManager from './pages/CodificationManager';
import LoginPage from './pages/LoginPage';
import UserManager from './pages/UserManager';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ChangePasswordModal from './components/ChangePasswordModal';
import ThemeToggle from './components/ThemeToggle';
import { useAuth } from './context/AuthContext';

function AuthenticatedLayout() {
    const { user, isAdmin, logout } = useAuth();
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [passwordSuccessNotice, setPasswordSuccessNotice] = useState(false);

    const catalogDropdownRef = useRef<HTMLLIElement>(null);
    const userDropdownRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (catalogDropdownRef.current && !catalogDropdownRef.current.contains(target)) {
                setIsCatalogOpen(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!passwordSuccessNotice) return;
        const timer = window.setTimeout(() => setPasswordSuccessNotice(false), 4000);
        return () => window.clearTimeout(timer);
    }, [passwordSuccessNotice]);

    const closeAllMenus = () => {
        setIsCatalogOpen(false);
        setIsUserMenuOpen(false);
    };

    const mustChangePassword = Boolean(user?.mustChangePassword);

    return (
        <div className="min-h-screen bg-base-200 print:bg-white">
            {/* NAVBAR SUPERIOR */}
            <div className="navbar bg-base-100 shadow-sm px-6 print:hidden">
                <div className="flex-1">
                    <Link
                        to="/apus"
                        className="btn btn-ghost text-xl font-bold"
                        onClick={closeAllMenus}
                    >
                        APU Gen
                    </Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1 font-semibold gap-2 items-center">
                        <li>
                            <Link to="/apus" onClick={closeAllMenus}>
                                Procesos / APUs
                            </Link>
                        </li>

                        {/* MENÚ DESPLEGABLE DE CATÁLOGOS */}
                        <li className="relative" ref={catalogDropdownRef}>
                            <details open={isCatalogOpen} className="dropdown">
                                <summary
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsCatalogOpen((prev) => !prev);
                                        setIsUserMenuOpen(false);
                                    }}
                                >
                                    Catálogos
                                </summary>
                                <ul className="p-2 bg-base-100 rounded-box shadow-xl border border-base-200 z-50 w-48 absolute right-0 mt-2">
                                    <li>
                                        <Link to="/catalogos/empresas" onClick={closeAllMenus}>
                                            Empresas
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/catalogos/materiales" onClick={closeAllMenus}>
                                            Materiales
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/catalogos/equipos" onClick={closeAllMenus}>
                                            Equipos
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/catalogos/cargos" onClick={closeAllMenus}>
                                            Mano de Obra
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/catalogos/codificaciones" onClick={closeAllMenus}>
                                            Codificaciones
                                        </Link>
                                    </li>
                                </ul>
                            </details>
                        </li>

                        {/* ACCESO A USUARIOS SOLO PARA ADMIN */}
                        {isAdmin && (
                            <li>
                                <Link to="/usuarios" onClick={closeAllMenus}>
                                    Usuarios
                                </Link>
                            </li>
                        )}

                        {/* MENÚ DEL USUARIO AUTENTICADO */}
                        <li className="relative" ref={userDropdownRef}>
                            <details open={isUserMenuOpen} className="dropdown">
                                <summary
                                    className="cursor-pointer flex items-center gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsUserMenuOpen((prev) => !prev);
                                        setIsCatalogOpen(false);
                                    }}
                                >
                                    <span className="max-w-36 truncate">
                                        {user?.fullName || user?.username}
                                    </span>
                                    <span
                                        className={`badge badge-xs ${
                                            isAdmin ? 'badge-primary' : 'badge-ghost'
                                        }`}
                                    >
                                        {isAdmin ? 'Admin' : 'Usuario'}
                                    </span>
                                </summary>
                                <ul className="p-2 bg-base-100 rounded-box shadow-xl border border-base-200 z-50 w-56 absolute right-0 mt-2">
                                    <li className="menu-title px-3 py-1">
                                        <span className="text-xs font-normal text-base-content/70">
                                            Conectado como <strong>{user?.username}</strong>
                                        </span>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                closeAllMenus();
                                                setIsChangePasswordOpen(true);
                                            }}
                                        >
                                            Cambiar contraseña
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            className="text-error"
                                            onClick={() => {
                                                closeAllMenus();
                                                logout();
                                            }}
                                        >
                                            Cerrar sesión
                                        </button>
                                    </li>
                                </ul>
                            </details>
                        </li>

                        {/* SELECTOR DE TEMA CLARO / OSCURO */}
                        <li>
                            <ThemeToggle className="!px-2" />
                        </li>
                    </ul>
                </div>
            </div>

            {passwordSuccessNotice && (
                <div className="max-w-7xl mx-auto px-4 pt-4 print:hidden">
                    <div className="alert alert-success py-2.5 shadow-sm">
                        <span>Tu contraseña ha sido actualizada correctamente.</span>
                    </div>
                </div>
            )}

            {/* CONTENIDO DE LA RUTA ACTIVA */}
            <main className="max-w-7xl mx-auto py-8 px-4 print:p-0 print:max-w-none">
                <Outlet />
            </main>

            {/* MODAL DE CAMBIO DE CONTRASEÑA (VOLUNTARIO O FORZADO) */}
            <ChangePasswordModal
                isOpen={mustChangePassword || isChangePasswordOpen}
                forced={mustChangePassword}
                onClose={() => setIsChangePasswordOpen(false)}
                onSuccess={() => setPasswordSuccessNotice(true)}
            />
        </div>
    );
}

function App() {
    return (
        <Routes>
            {/* RUTA PÚBLICA */}
            <Route path="/login" element={<LoginPage />} />

            {/* RUTAS PROTEGIDAS DEL SISTEMA */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route path="/" element={<Navigate replace to="/apus" />} />

                    {/* Procesos (Obras) */}
                    <Route path="/apus" element={<ApuList />} />
                    <Route path="/apus/nuevo" element={<ProcessForm />} />
                    <Route path="/apus/editar" element={<ProcessForm />} />
                    <Route path="/apus/detalle" element={<ProcessDetail />} />

                    {/* Servicios (APUs individuales dentro de una Obra) */}
                    <Route path="/apus/servicio/nuevo" element={<ApuForm />} />
                    <Route path="/apus/servicio/editar" element={<ApuForm />} />
                    <Route path="/apus/servicio/detalle" element={<ApuDetail />} />

                    {/* Catálogos Maestros */}
                    <Route path="/catalogos/empresas" element={<CompanyManager />} />
                    <Route path="/catalogos/materiales" element={<MaterialManager />} />
                    <Route path="/catalogos/equipos" element={<EquipmentManager />} />
                    <Route path="/catalogos/cargos" element={<LaborManager />} />
                    <Route path="/catalogos/codificaciones" element={<CodificationManager />} />

                    {/* Administración de Usuarios (Solo ADMIN) */}
                    <Route element={<AdminRoute />}>
                        <Route path="/usuarios" element={<UserManager />} />
                    </Route>
                </Route>
            </Route>

            {/* CUALQUIER OTRA RUTA REDIRIGE AL INICIO PROTEGIDO */}
            <Route path="*" element={<Navigate replace to="/apus" />} />
        </Routes>
    );
}

export default App;