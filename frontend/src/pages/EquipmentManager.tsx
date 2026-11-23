import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import type { Equipment } from '../types';

interface EquipmentFormState {
    id: string;
    description: string;
    baseValue: string;
    depreciationFactor: string;
}

const INITIAL_FORM: EquipmentFormState = {
    id: '',
    description: '',
    baseValue: '',
    depreciationFactor: '',
};

export default function EquipmentManager() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    const [currentEquipment, setCurrentEquipment] = useState<EquipmentFormState>(INITIAL_FORM);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getEquipments();
            setEquipments(data);
        } catch {
            setError('Error al cargar los equipos del servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEquipment(); }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentEquipment(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setModalError(null);
        setModalSuccess(null);
        setCurrentEquipment(INITIAL_FORM);
        (document.getElementById('modal_equipment') as HTMLDialogElement)?.showModal();
    };

    const openEditModal = (equ: Equipment) => {
        setIsEditing(true);
        setModalError(null);
        setModalSuccess(null);
        setCurrentEquipment({
            id: equ.id,
            description: equ.description,
            baseValue: String(equ.baseValue),
            depreciationFactor: String(equ.depreciationFactor),
        });
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

        const parsedBaseValue = parseFloat(currentEquipment.baseValue);
        const parsedDepreciation = parseFloat(currentEquipment.depreciationFactor);

        if (Number.isNaN(parsedBaseValue) || parsedBaseValue < 0) {
            setModalError('El precio base debe ser un número válido.');
            return;
        }

        if (Number.isNaN(parsedDepreciation) || parsedDepreciation === 0) {
            setModalError('El factor de depreciación no puede ser 0.');
            return;
        }

        if (parsedDepreciation < 0) {
            setModalError('El factor de depreciación debe ser mayor que 0.');
            return;
        }

        const payload: Equipment = {
            id: currentEquipment.id.trim(),
            description: currentEquipment.description.trim(),
            baseValue: parsedBaseValue,
            depreciationFactor: parsedDepreciation,
        };

        try {
            if (isEditing) {
                await catalogService.updateEquipment(payload.id, payload);
                setSuccessMessage('Equipo actualizado exitosamente.');
                fetchEquipment();
                closeModal();
            } else {
                await catalogService.createEquipment(payload);
                fetchEquipment();
                setModalSuccess(`¡Equipo ${payload.id} registrado! Puedes registrar otro.`);
                setCurrentEquipment(INITIAL_FORM);
                document.getElementById('input-mat-id')?.focus();
            }
        } catch (err: any) {
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
                            <td className="font-semibold">{equ.id}</td><td>{equ.description}</td><td><span className="badge badge-ghost">{equ.baseValue.toFixed(2)}</span></td><td>{equ.depreciationFactor.toFixed(6)}</td>
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
                            <input type="number" step="any" name="baseValue" value={currentEquipment.baseValue} onChange={handleInputChange} className="input input-bordered" placeholder="0.00" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">F. Depreciación*</span></label>
                            <input type="number" step="any" name="depreciationFactor" value={currentEquipment.depreciationFactor} onChange={handleInputChange} className="input input-bordered" placeholder="0.000000" required />
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