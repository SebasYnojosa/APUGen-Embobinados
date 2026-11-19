import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import type {Equipment, Labor} from '../types';

export default function LaborManager() {
    const [labors, setLabor] = useState<Labor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentLabor, setCurrentLabor] = useState<Labor>({ id: '', description: '', baseDailyWage: 0 });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchLabor = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getLabors();
            setLabor(data);
        } catch (err) {
            setError('Error al cargar los cargos desde el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLabor(); }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentLabor(prev => ({ ...prev, [name]: name === 'baseDailyWage' ? parseFloat(value) || 0 : value }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setModalError(null); setModalSuccess(null);
        setCurrentLabor({ id: '', description: '', baseDailyWage: 0 });
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.showModal();
    };

    const openEditModal = (lab: Labor) => {
        setIsEditing(true);
        setModalError(null); setModalSuccess(null);
        setCurrentLabor(lab);
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.showModal();
    };

    const closeModal = () => {
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.close();
        setModalError(null); setModalSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null); setModalSuccess(null);

        try {
            if (isEditing) {
                await catalogService.updateLabor(currentLabor.id, currentLabor);
                setSuccessMessage('Cargo actualizado exitosamente.');
                fetchLabor();
                closeModal();
            } else {
                await catalogService.createLabor(currentLabor);
                fetchLabor();
                setModalSuccess(`¡Cargo ${currentLabor.id} registrado! Puedes registrar otro.`);
                setCurrentLabor({ id: '', description: '', baseDailyWage: 0 });
                document.getElementById('input-eq-id')?.focus();
            }
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Error al guardar el cargo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de eliminar el cargo con ID: ${id}?`)) return;
        setError(null); setSuccessMessage(null);
        try {
            await catalogService.deleteLabor(id);
            setSuccessMessage('Cargo eliminado correctamente.');
            fetchLabor();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el cargo porque está en uso.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">Gestión de Cargos</h1><p className="text-sm text-base-content/70">Administra a los trabajadores y sus salarios diarios</p></div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>+ Nuevo Cargo</button>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}
            {successMessage && <div className="alert alert-success mb-4 shadow-sm"><span>{successMessage}</span></div>}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead><tr><th>ID</th><th>Descripción</th><th>Salario Diario</th><th className="text-center">Acciones</th></tr></thead>
                    <tbody>
                    {loading ? <tr><td colSpan={5} className="text-center py-6">Cargando cargos...</td></tr> : labors.length === 0 ? <tr><td colSpan={5} className="text-center py-6">No hay cargos registrados.</td></tr> : labors.map((lab) => (
                        <tr key={lab.id}>
                            <td className="font-semibold">{lab.id}</td><td>{lab.description}</td><td>${lab.baseDailyWage.toFixed(2)}</td>
                            <td className="text-center space-x-2">
                                <button className="btn btn-xs btn-outline btn-info" onClick={() => openEditModal(lab)}>Editar</button>
                                <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(lab.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <dialog id="modal_equipment" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">{isEditing ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}</h3>
                    {modalError && <div className="alert alert-error py-2 mb-4 text-sm shadow-sm"><span>{modalError}</span></div>}
                    {modalSuccess && <div className="alert alert-success py-2 mb-4 text-sm shadow-sm"><span>{modalSuccess}</span></div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID del Cargo*</span></label>
                            <input id="input-eq-id" type="text" name="id" value={currentLabor.id} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: MDO-001" required disabled={isEditing} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Descripción*</span></label>
                            <input type="text" name="description" value={currentLabor.description} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: Ingeniero" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Salario Diario*</span></label>
                            <input type="number" step="0.01" name="baseDailyWage" value={currentLabor.baseDailyWage || ''} onChange={handleInputChange} className="input input-bordered" placeholder="0.01" required />
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">{isEditing ? 'Actualizar' : 'Guardar'}</button>
                            <button type="button" className="btn" onClick={closeModal}>Cerrar</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}