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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [passwordSuccessNotice, setPasswordSuccessNotice] = useState(false);

    const headerRef = useRef<HTMLElement>(null);
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
            if (headerRef.current && !headerRef.current.contains(target)) {
                setIsMobileMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsCatalogOpen(false);
                setIsUserMenuOpen(false);
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!passwordSuccessNotice) return;
        const timer = window.setTimeout(() => setPasswordSuccessNotice(false), 4000);
        return () => window.clearTimeout(timer);
    }, [passwordSuccessNotice]);

    const closeAllMenus = () => {
        setIsCatalogOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsMobileCatalogOpen(false);
    };

    const mustChangePassword = Boolean(user?.mustChangePassword);

    return (
        <div className="min-h-screen bg-base-200 print:bg-white overflow-x-clip">
            {/* NAVBAR SUPERIOR */}
            <header ref={headerRef} className="bg-base-100 shadow-sm print:hidden sticky top-0 z-40">
                <div className="navbar max-w-7xl mx-auto px-3 sm:px-6 min-h-14">
                    <div className="flex-1 min-w-0">
                        <Link
                            to="/apus"
                            className="btn btn-ghost text-lg sm:text-xl font-bold whitespace-nowrap px-2 sm:px-3"
                            onClick={closeAllMenus}
                        >
                            APU Gen
                        </Link>
                    </div>

                    {/* MENÚ DE ESCRITORIO (lg+) */}
                    <div className="hidden lg:flex flex-none">
                        <ul className="menu menu-horizontal px-1 font-semibold gap-1 xl:gap-2 items-center">
                            <li>
                                <Link to="/apus" className="whitespace-nowrap" onClick={closeAllMenus}>
                                    Procesos / APUs
                                </Link>
                            </li>

                            {/* MENÚ DESPLEGABLE DE CATÁLOGOS */}
                            <li className="relative" ref={catalogDropdownRef}>
                                <details open={isCatalogOpen} className="dropdown">
                                    <summary
                                        className="cursor-pointer whitespace-nowrap"
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
                                    <Link to="/usuarios" className="whitespace-nowrap" onClick={closeAllMenus}>
                                        Usuarios
                                    </Link>
                                </li>
                            )}

                            {/* MENÚ DEL USUARIO AUTENTICADO */}
                            <li className="relative" ref={userDropdownRef}>
                                <details open={isUserMenuOpen} className="dropdown">
                                    <summary
                                        className="cursor-pointer flex items-center gap-2 whitespace-nowrap"
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

                    {/* CONTROLES MÓVIL / TABLET (< lg) */}
                    <div className="flex lg:hidden items-center gap-1 shrink-0">
                        <ThemeToggle className="!px-2" />
                        <button
                            type="button"
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                            aria-expanded={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        >
                            {isMobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* PANEL DESPLEGABLE FLOTANTE MÓVIL / TABLET (< lg) */}
                <div
                    className={`lg:hidden absolute left-4 right-4 sm:left-auto sm:right-6 sm:w-72 top-full mt-2 z-50 grid transition-all duration-200 ease-out origin-top ${
                        isMobileMenuOpen
                            ? 'grid-rows-[1fr] opacity-100 translate-y-0 visible pointer-events-auto'
                            : 'grid-rows-[0fr] opacity-0 -translate-y-2 invisible pointer-events-none'
                    }`}
                    aria-hidden={!isMobileMenuOpen}
                >
                    <div className="overflow-hidden rounded-box bg-base-100 border border-base-300 shadow-2xl">
                        <nav className="p-3 max-h-[calc(100vh-5rem)] overflow-y-auto">
                            <div className="flex flex-col gap-1 text-sm font-semibold">
                                <Link
                                    to="/apus"
                                    className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                    onClick={closeAllMenus}
                                >
                                    Procesos / APUs
                                </Link>

                                <div>
                                    <button
                                        type="button"
                                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors cursor-pointer"
                                        onClick={() => setIsMobileCatalogOpen((prev) => !prev)}
                                        aria-expanded={isMobileCatalogOpen}
                                    >
                                        <span>Catálogos</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-4 w-4 transition-transform duration-200 ${isMobileCatalogOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div
                                        className={`grid transition-all duration-200 ease-out ${
                                            isMobileCatalogOpen
                                                ? 'grid-rows-[1fr] opacity-100 mt-1'
                                                : 'grid-rows-[0fr] opacity-0'
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="ml-3 pl-2 border-l border-base-300 flex flex-col gap-0.5 font-normal">
                                                <Link
                                                    to="/catalogos/empresas"
                                                    className="flex items-center w-full px-3 py-1.5 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                                    onClick={closeAllMenus}
                                                >
                                                    Empresas
                                                </Link>
                                                <Link
                                                    to="/catalogos/materiales"
                                                    className="flex items-center w-full px-3 py-1.5 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                                    onClick={closeAllMenus}
                                                >
                                                    Materiales
                                                </Link>
                                                <Link
                                                    to="/catalogos/equipos"
                                                    className="flex items-center w-full px-3 py-1.5 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                                    onClick={closeAllMenus}
                                                >
                                                    Equipos
                                                </Link>
                                                <Link
                                                    to="/catalogos/cargos"
                                                    className="flex items-center w-full px-3 py-1.5 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                                    onClick={closeAllMenus}
                                                >
                                                    Mano de Obra
                                                </Link>
                                                <Link
                                                    to="/catalogos/codificaciones"
                                                    className="flex items-center w-full px-3 py-1.5 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                                    onClick={closeAllMenus}
                                                >
                                                    Codificaciones
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <Link
                                        to="/usuarios"
                                        className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                                        onClick={closeAllMenus}
                                    >
                                        Usuarios
                                    </Link>
                                )}
                            </div>

                            <div className="divider my-2" />

                            <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {user?.fullName || user?.username}
                                    </p>
                                    <p className="text-xs text-base-content/70 truncate">
                                        Conectado como <strong>{user?.username}</strong>
                                    </p>
                                </div>
                                <span className={`badge badge-sm shrink-0 ${isAdmin ? 'badge-primary' : 'badge-ghost'}`}>
                                    {isAdmin ? 'Admin' : 'Usuario'}
                                </span>
                            </div>

                            <div className="flex flex-col gap-0.5 mt-1 text-sm">
                                <button
                                    type="button"
                                    className="flex items-center w-full px-3 py-2 rounded-lg text-left hover:bg-base-200 active:bg-base-300 transition-colors cursor-pointer"
                                    onClick={() => {
                                        closeAllMenus();
                                        setIsChangePasswordOpen(true);
                                    }}
                                >
                                    Cambiar contraseña
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center w-full px-3 py-2 rounded-lg text-left text-error hover:bg-error/10 active:bg-error/20 transition-colors cursor-pointer"
                                    onClick={() => {
                                        closeAllMenus();
                                        logout();
                                    }}
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {passwordSuccessNotice && (
                <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 print:hidden">
                    <div className="alert alert-success py-2.5 shadow-sm">
                        <span>Tu contraseña ha sido actualizada correctamente.</span>
                    </div>
                </div>
            )}

            {/* CONTENIDO DE LA RUTA ACTIVA */}
            <main className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4 print:p-0 print:max-w-none">
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