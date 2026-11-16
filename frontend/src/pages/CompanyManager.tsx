import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import type { Company } from '../types';

export default function CompanyManager() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [currentCompany, setCurrentCompany] = useState<Company>({ id: '', name: '' });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getCompanies();
            setCompanies(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar las empresas desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentCompany(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentCompany({ id: '', name: '' });
        (document.getElementById('modal_company') as HTMLDialogElement)?.showModal();
    };

    const openEditModal = (company: Company) => {
        setIsEditing(true);
        setCurrentCompany(company);
        (document.getElementById('modal_company') as HTMLDialogElement)?.showModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            if (isEditing) {
                await catalogService.updateCompany(currentCompany.id, currentCompany);
                setSuccessMessage('Empresa actualizada exitosamente.');
            } else {
                await catalogService.createCompany(currentCompany);
                setSuccessMessage('Empresa registrada exitosamente.');
            }
            fetchCompanies();
            (document.getElementById('modal_company') as HTMLDialogElement)?.close();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar la empresa.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de eliminar la empresa con ID: ${id}?`)) return;
        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteCompany(id);
            setSuccessMessage('Empresa eliminada correctamente.');
            fetchCompanies();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar la empresa porque está asociada a un APU.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Empresas</h1>
                    <p className="text-sm text-base-content/70">Catálogo de clientes y empresas solicitantes.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>+ Nueva Empresa</button>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}
            {successMessage && <div className="alert alert-success mb-4 shadow-sm"><span>{successMessage}</span></div>}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre de la Empresa</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={3} className="text-center py-6">Cargando empresas...</td></tr>
                    ) : companies.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-6">No hay empresas registradas.</td></tr>
                    ) : (
                        companies.map((comp) => (
                            <tr key={comp.id}>
                                <td className="font-semibold">{comp.id}</td>
                                <td>{comp.name}</td>
                                <td className="text-center space-x-2">
                                    <button className="btn btn-xs btn-outline btn-info" onClick={() => openEditModal(comp)}>Editar</button>
                                    <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(comp.id)}>Eliminar</button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            <dialog id="modal_company" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">{isEditing ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID de la Empresa*</span></label>
                            <input type="text" name="id" value={currentCompany.id} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: EMP-01" required disabled={isEditing} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Nombre de la Empresa*</span></label>
                            <input type="text" name="name" value={currentCompany.name} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: CVG Ferrominera Orinoco" required />
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">{isEditing ? 'Actualizar' : 'Guardar'}</button>
                            <button type="button" className="btn" onClick={() => (document.getElementById('modal_company') as HTMLDialogElement)?.close()}>Cancelar</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}