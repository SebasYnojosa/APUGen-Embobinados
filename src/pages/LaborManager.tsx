import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import type { Labor } from '../types';

export default function LaborManager() {
    const [labors, setLabors] = useState<Labor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [currentLabor, setCurrentLabor] = useState<Labor>({
        id: '',
        description: '',
        baseDailyWage: 0
    });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchLabors = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getLabors();
            setLabors(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar los cargos desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabors();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentLabor(prev => ({
            ...prev,
            [name]: name === 'baseDailyWage' ? parseFloat(value) || 0 : value
        }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentLabor({ id: '', description: '', baseDailyWage: 0 });
        (document.getElementById('modal_labor') as HTMLDialogElement)?.showModal();
    };

    const openEditModal = (labor: Labor) => {
        setIsEditing(true);
        setCurrentLabor(labor);
        (document.getElementById('modal_labor') as HTMLDialogElement)?.showModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            if (isEditing) {
                await catalogService.updateLabor(currentLabor.id, currentLabor);
                setSuccessMessage('Cargo actualizado exitosamente.');
            } else {
                await catalogService.createLabor(currentLabor);
                setSuccessMessage('Cargo registrado exitosamente.');
            }
            fetchLabors();
            (document.getElementById('modal_labor') as HTMLDialogElement)?.close();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar el cargo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de eliminar el cargo con ID: ${id}?`)) return;
        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteLabor(id);
            setSuccessMessage('Cargo eliminado correctamente.');
            fetchLabors();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el cargo porque está en uso.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Mano de Obra</h1>
                    <p className="text-sm text-base-content/70">Cargos técnicos y sus salarios diarios base.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>+ Nuevo Cargo</button>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}
            {successMessage && <div className="alert alert-success mb-4 shadow-sm"><span>{successMessage}</span></div>}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Descripción del Cargo</th>
                        <th>Salario Diario Base</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={4} className="text-center py-6">Cargando cargos...</td></tr>
                    ) : labors.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-6">No hay cargos registrados.</td></tr>
                    ) : (
                        labors.map((lab) => (
                            <tr key={lab.id}>
                                <td className="font-semibold">{lab.id}</td>
                                <td>{lab.description}</td>
                                <td>${lab.baseDailyWage.toFixed(2)}</td>
                                <td className="text-center space-x-2">
                                    <button className="btn btn-xs btn-outline btn-info" onClick={() => openEditModal(lab)}>Editar</button>
                                    <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(lab.id)}>Eliminar</button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            <dialog id="modal_labor" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">{isEditing ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID del Cargo*</span></label>
                            <input type="text" name="id" value={currentLabor.id} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: LAB-01" required disabled={isEditing} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Descripción / Título del Cargo*</span></label>
                            <input type="text" name="description" value={currentLabor.description} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: Técnico Embobinador Principal" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Salario Diario Base*</span></label>
                            <input type="number" step="0.01" name="baseDailyWage" value={currentLabor.baseDailyWage} onChange={handleInputChange} className="input input-bordered" placeholder="0.00" required />
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">{isEditing ? 'Actualizar' : 'Guardar'}</button>
                            <button type="button" className="btn" onClick={() => (document.getElementById('modal_labor') as HTMLDialogElement)?.close()}>Cancelar</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}