import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogServices';
import type { Material } from '../types';

export default function MaterialManager() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estado del formulario (sirve tanto para crear como para editar)
    const [currentMaterial, setCurrentMaterial] = useState<Material>({
        id: '',
        description: '',
        unit: '',
        baseCost: 0
    });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // Cargar materiales
    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const data = await catalogService.getMaterials();
            setMaterials(data);
            setError(null);
        } catch (err: any) {
            setError('Error al cargar los materiales del servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    // Manejar cambios en los inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentMaterial(prev => ({
            ...prev,
            [name]: name === 'baseCost' ? parseFloat(value) || 0 : value
        }));
    };

    // Abrir modal para Crear
    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentMaterial({ id: '', description: '', unit: '', baseCost: 0 });
        (document.getElementById('modal_material') as HTMLDialogElement)?.showModal();
    };

    // Abrir modal para Editar
    const openEditModal = (mat: Material) => {
        setIsEditing(true);
        setCurrentMaterial(mat);
        (document.getElementById('modal_material') as HTMLDialogElement)?.showModal();
    };

    // Guardar (Crear o Actualizar)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            if (isEditing) {
                await catalogService.updateMaterial(currentMaterial.id, currentMaterial);
                setSuccessMessage('Material actualizado exitosamente.');
            } else {
                await catalogService.createMaterial(currentMaterial);
                setSuccessMessage('Material registrado exitosamente.');
            }
            fetchMaterials();
            (document.getElementById('modal_material') as HTMLDialogElement)?.close();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
        }
    };

    // Eliminar Material
    const handleDelete = async (id: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el material con ID: ${id}?`)) return;

        setError(null);
        setSuccessMessage(null);
        try {
            await catalogService.deleteMaterial(id);
            setSuccessMessage('Material eliminado correctamente.');
            fetchMaterials();
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se puede eliminar el material porque está en uso.');
        }
    };

    return (
        <div className="p-6 bg-base-100 rounded-box shadow max-w-6xl mx-auto border border-base-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Materiales</h1>
                    <p className="text-sm text-base-content/70">Administra los insumos y costos base para los APUs.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                    + Nuevo Material
                </button>
            </div>

            {error && <div className="alert alert-error mb-4 shadow-sm"><span>{error}</span></div>}
            {successMessage && <div className="alert alert-success mb-4 shadow-sm"><span>{successMessage}</span></div>}

            {/* --- TABLA DE MATERIALES --- */}
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Descripción</th>
                        <th>Unidad</th>
                        <th>Costo Base</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={5} className="text-center py-6">Cargando materiales...</td></tr>
                    ) : materials.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-6">No hay materiales registrados.</td></tr>
                    ) : (
                        materials.map((mat) => (
                            <tr key={mat.id}>
                                <td className="font-semibold">{mat.id}</td>
                                <td>{mat.description}</td>
                                <td><span className="badge badge-ghost">{mat.unit}</span></td>
                                <td>${mat.baseCost.toFixed(2)}</td>
                                <td className="text-center space-x-2">
                                    <button className="btn btn-xs btn-outline btn-info" onClick={() => openEditModal(mat)}>
                                        Editar
                                    </button>
                                    <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDelete(mat.id)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL UNIFICADO PARA CREAR / EDITAR --- */}
            <dialog id="modal_material" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">
                        {isEditing ? 'Editar Material' : 'Registrar Nuevo Material'}
                    </h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID del Material*</span></label>
                            <input
                                type="text"
                                name="id"
                                value={currentMaterial.id}
                                onChange={handleInputChange}
                                className="input input-bordered"
                                placeholder="Ej: MAT-001"
                                required
                                disabled={isEditing} // El ID no se debe cambiar si se está editando
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Descripción*</span></label>
                            <input
                                type="text"
                                name="description"
                                value={currentMaterial.description}
                                onChange={handleInputChange}
                                className="input input-bordered"
                                placeholder="Ej: Alambre de Cobre esmaltado"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Unidad de Medida*</span></label>
                            <input
                                type="text"
                                name="unit"
                                value={currentMaterial.unit}
                                onChange={handleInputChange}
                                className="input input-bordered"
                                placeholder="Ej: kg, m, rollos"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Costo Base*</span></label>
                            <input
                                type="number"
                                step="0.01"
                                name="baseCost"
                                value={currentMaterial.baseCost}
                                onChange={handleInputChange}
                                className="input input-bordered"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">
                                {isEditing ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button type="button" className="btn" onClick={() => (document.getElementById('modal_material') as HTMLDialogElement)?.close()}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}