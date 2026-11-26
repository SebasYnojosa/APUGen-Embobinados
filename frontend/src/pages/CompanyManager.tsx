import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import { formatDateTime } from '../utils/dateUtils';
import type { Company } from '../types';

export default function CompanyManager() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentCompany, setCurrentCompany] = useState<Company>({ id: '', name: '' });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getCompanies();
            setCompanies(data);
        } catch (err) {
            setError('Error al cargar las empresas desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentCompany(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setModalError(null); setModalSuccess(null);
        setCurrentCompany({ id: '', name: '' });
        (document.getElementById('modal_company') as HTMLDialogElement)?.showModal();
    };

    const openEditModal = (company: Company) => {
        setIsEditing(true);
        setModalError(null); setModalSuccess(null);
        setCurrentCompany(company);
        (document.getElementById('modal_company') as HTMLDialogElement)?.showModal();
    };

    const closeModal = () => {
        (document.getElementById('modal_company') as HTMLDialogElement)?.close();
        setModalError(null); setModalSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null); setModalSuccess(null);

        try {
            if (isEditing) {
                await catalogService.updateCompany(currentCompany.id, currentCompany);
                setSuccessMessage('Empresa actualizada exitosamente.');
                fetchCompanies();
                closeModal();
            } else {
                await catalogService.createCompany(currentCompany);
                fetchCompanies();
                setModalSuccess(`¡Empresa ${currentCompany.id} registrada! Puedes registrar otra.`);
                setCurrentCompany({ id: '', name: '' });
                document.getElementById('input-comp-id')?.focus();
            }
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Error al guardar la empresa.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de eliminar la empresa con ID: ${id}?`)) return;
        setError(null); setSuccessMessage(null);
        try {
            await catalogService.deleteCompany(id);
            setSuccessMessage('Empresa eliminada correctamente.');
            fetchCompanies();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar la empresa porque está asociada a un APU.');
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-base-100 rounded-box shadow max-w-7xl mx-auto border border-base-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold">Gestión de Empresas</h1>
                </div>
                <button className="btn btn-primary btn-sm self-center sm:self-auto whitespace-nowrap w-48" onClick={openCreateModal}>
                    + Nueva Empresa
                </button>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}
            {successMessage && <div className="alert alert-success mb-4 shadow-sm"><span>{successMessage}</span></div>}

            {/* VISTA EN TARJETAS (< lg) */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-base-content/70">Cargando empresas...</div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">No hay empresas registradas.</div>
                ) : (
                    companies.map((comp) => (
                        <article
                            key={comp.id}
                            className="p-4 rounded-box bg-base-200/40 border border-base-300 space-y-2.5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-mono text-xs font-bold badge badge-ghost h-auto py-1 break-all">
                                    {comp.id}
                                </span>
                            </div>
                            <p className="font-semibold text-sm sm:text-base break-words">{comp.name}</p>
                            <div className="pt-2 border-t border-base-300/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="text-xs text-base-content/70 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span><span className="font-semibold">Creado:</span> {formatDateTime(comp.createdAt)}</span>
                                    <span><span className="font-semibold">Act.:</span> {formatDateTime(comp.updatedAt)}</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                                    <button type="button" className="btn btn-xs btn-outline btn-info whitespace-nowrap w-20" onClick={() => openEditModal(comp)}>Editar</button>
                                    <button type="button" className="btn btn-xs btn-outline btn-error whitespace-nowrap w-20" onClick={() => handleDelete(comp.id)}>Eliminar</button>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* VISTA EN TABLA (lg+) */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="table table-zebra table-sm w-full [&_th]:px-2.5 [&_td]:px-2.5">
                    <thead>
                        <tr>
                            <th className="whitespace-nowrap">ID</th>
                            <th>Nombre de la Empresa</th>
                            <th className="whitespace-nowrap">Creado</th>
                            <th className="whitespace-nowrap">Actualizado</th>
                            <th className="text-center whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? <tr><td colSpan={5} className="text-center py-6">Cargando empresas...</td></tr> : companies.length === 0 ? <tr><td colSpan={5} className="text-center py-6">No hay empresas registradas.</td></tr> : companies.map((comp) => (
                        <tr key={comp.id}>
                            <td className="font-semibold whitespace-nowrap">{comp.id}</td>
                            <td className="break-words">{comp.name}</td>
                            <td className="text-xs text-base-content/70 whitespace-nowrap tabular-nums">{formatDateTime(comp.createdAt)}</td>
                            <td className="text-xs text-base-content/70 whitespace-nowrap tabular-nums">{formatDateTime(comp.updatedAt)}</td>
                            <td className="whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                    <button type="button" className="btn btn-xs btn-outline btn-info whitespace-nowrap w-20" onClick={() => openEditModal(comp)}>Editar</button>
                                    <button type="button" className="btn btn-xs btn-outline btn-error whitespace-nowrap w-20" onClick={() => handleDelete(comp.id)}>Eliminar</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <dialog id="modal_company" className="modal">
                <div className="modal-box w-11/12 max-w-md max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4">{isEditing ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h3>
                    {modalError && <div className="alert alert-error py-2 mb-4 text-sm shadow-sm"><span>{modalError}</span></div>}
                    {modalSuccess && <div className="alert alert-success py-2 mb-4 text-sm shadow-sm"><span>{modalSuccess}</span></div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID de la Empresa*</span></label>
                            <input id="input-comp-id" type="text" name="id" value={currentCompany.id} onChange={handleInputChange} className="input input-bordered w-full" required disabled={isEditing} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Nombre de la Empresa*</span></label>
                            <input type="text" name="name" value={currentCompany.name} onChange={handleInputChange} className="input input-bordered w-full" required />
                        </div>
                        <div className="modal-action flex-wrap justify-center sm:justify-end gap-2 mt-2">
                            <button type="submit" className="btn btn-primary w-36">{isEditing ? 'Actualizar' : 'Guardar'}</button>
                            <button type="button" className="btn w-36" onClick={closeModal}>Cerrar</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={closeModal}>close</button>
                </form>
            </dialog>
        </div>
    );
}