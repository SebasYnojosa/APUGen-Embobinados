import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import type { Equipment } from '../types';

export default function EquipmentManager() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // NUEVO: Estados específicos para el modal
    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentEquipment, setCurrentEquipment] = useState<Equipment>({ id: '', description: '', baseValue: 0, depreciationFactor: 0 });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getEquipments();
            setEquipments(data);
        } catch (err: any) {
            setError('Error al cargar los materiales del servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEquipment(); }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentEquipment(prev => ({ ...prev, [name]: name === 'baseValue' || name == 'depreciationFactor' ? parseFloat(value) || 0 : value }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setModalError(null);
        setModalSuccess(null);
        setCurrentEquipment({ id: '', description: '', baseValue: 0, depreciationFactor: 0 });
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.showModal();
    };

    const openEditModal = (equ: Equipment) => {
        setIsEditing(true);
        setModalError(null);
        setModalSuccess(null);
        setCurrentEquipment(equ);
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.showModal();
    };

    const closeModal = () => {
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.close();
        setModalError(null);
        setModalSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setModalSuccess(null);

        try {
            if (isEditing) {
                await catalogService.updateEquipment(currentEquipment.id, currentEquipment);
                setSuccessMessage('Material actualizado exitosamente.');
                fetchEquipment();
                closeModal(); // Si edita, sí cerramos el modal
            } else {
                await catalogService.createEquipment(currentEquipment);
                fetchEquipment();
                setModalSuccess(`¡Equipo ${currentEquipment.id} registrado! Puedes registrar otro.`);
                // Limpiamos los inputs para creación continua
                setCurrentEquipment({ id: '', description: '', baseValue: 0, depreciationFactor: 0 });
                // Devolvemos el foco al ID automáticamente
                document.getElementById('input-mat-id')?.focus();
            }
        } catch (err: any) {
            // El error ahora se muestra DENTRO del modal
            setModalError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el equipo con ID: ${id}?`)) return;
        setError(null); setSuccessMessage(null);
        try {
            await catalogService.deleteEquipment(id);
            setSuccessMessage('Equipo eliminado correctamente.');
            fetchEquipment();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el equipo porque está en uso.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">Gestión de Equipos</h1><p className="text-sm text-base-content/70">Administra los equipos, precios base y factores de depreciación para los APUs.</p></div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>+ Nuevo Equipo</button>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}
            {successMessage && <div className="alert alert-success mb-4 shadow-sm"><span>{successMessage}</span></div>}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead><tr><th>ID</th><th>Descripción</th><th>Precio Base</th><th>F. Depreciación</th><th className="text-center">Acciones</th></tr></thead>
                    <tbody>
                    {loading ? <tr><td colSpan={5} className="text-center py-6">Cargando equipos...</td></tr> : equipments.length === 0 ? <tr><td colSpan={5} className="text-center py-6">No hay equipos registrados.</td></tr> : equipments.map((equ) => (
                        <tr key={equ.id}>
                            <td className="font-semibold">{equ.id}</td><td>{equ.description}</td><td><span className="badge badge-ghost">{equ.baseValue.toFixed(2)}</span></td><td>${equ.depreciationFactor.toFixed(6)}</td>
                            <td className="text-center space-x-2">
                                <button className="btn btn-xs btn-outline btn-info" onClick={() => openEditModal(equ)}>Editar</button>
                                <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(equ.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <dialog id="modal_equipment" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">{isEditing ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}</h3>

                    {/* Alertas DENTRO del modal */}
                    {modalError && <div className="alert alert-error py-2 mb-4 text-sm shadow-sm"><span>{modalError}</span></div>}
                    {modalSuccess && <div className="alert alert-success py-2 mb-4 text-sm shadow-sm"><span>{modalSuccess}</span></div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID del Equipo*</span></label>
                            <input id="input-mat-id" type="text" name="id" value={currentEquipment.id} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: EQU-001" required disabled={isEditing} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Descripción*</span></label>
                            <input type="text" name="description" value={currentEquipment.description} onChange={handleInputChange} className="input input-bordered" placeholder="Ej: Barnizadora" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Precio Base*</span></label>
                            <input type="number" step="0.01" name="baseValue" value={currentEquipment.baseValue || ''} onChange={handleInputChange} className="input input-bordered" placeholder="0.00" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">F. Depreciación*</span></label>
                            <input type="number" step="0.000001" name="depreciationFactor" value={currentEquipment.depreciationFactor || ''} onChange={handleInputChange} className="input input-bordered" placeholder="0.000000" required />
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