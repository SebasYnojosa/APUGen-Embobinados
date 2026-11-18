import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ApuList from './pages/ApuList';
import ApuForm from './pages/ApuForm';
import ApuDetail from "./pages/ApuDetail.tsx";
import MaterialManager from './pages/MaterialManager';
import CompanyManager from './pages/CompanyManager';
import EquipmentManager from './pages/EquipmentManager';
import LaborManager from './pages/LaborManager';

function App() {
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const dropdownRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCatalogOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-base-200">
            {/* NAVBAR SUPERIOR */}
            <div className="navbar bg-base-100 shadow-sm px-6">
                <div className="flex-1">
                    <Link to="/" className="btn btn-ghost text-xl font-bold">APU Gen</Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1 font-semibold gap-2 items-center">
                        <li><Link to="/" onClick={() => setIsCatalogOpen(false)}>APUs</Link></li>

                        {/* MENÚ DESPLEGABLE DE CATÁLOGOS COMPLETO */}
                        <li className="relative" ref={dropdownRef}>
                            <details open={isCatalogOpen} className="dropdown">
                                <summary
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsCatalogOpen(!isCatalogOpen);
                                    }}
                                >
                                    Catálogos
                                </summary>
                                <ul className="p-2 bg-base-100 rounded-box shadow-xl border border-base-200 z-50 w-48 absolute right-0 mt-2">
                                    <li><Link to="/catalogos/empresas" onClick={() => setIsCatalogOpen(false)}>Empresas</Link></li>
                                    <li><Link to="/catalogos/materiales" onClick={() => setIsCatalogOpen(false)}>Materiales</Link></li>
                                    <li><Link to="/catalogos/equipos" onClick={() => setIsCatalogOpen(false)}>Equipos</Link></li>
                                    <li><Link to="/catalogos/cargos" onClick={() => setIsCatalogOpen(false)}>Mano de Obra</Link></li>
                                </ul>
                            </details>
                        </li>
                    </ul>
                </div>
            </div>

            {/* RUTAS DEL SISTEMA */}
            <main className="max-w-7xl mx-auto py-8 px-4">
                <Routes>
                    <Route path="/apus" element={<ApuList />} />
                    <Route path="/apus/nuevo" element={<ApuForm />} />
                    <Route path="/apus/detalle" element={<ApuDetail />} />
                    <Route path="/catalogos/empresas" element={<CompanyManager />} />
                    <Route path="/catalogos/materiales" element={<MaterialManager />} />
                    <Route path="/catalogos/equipos" element={<EquipmentManager />} />
                    <Route path="/catalogos/cargos" element={<LaborManager />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;