import { ALL_MOTOR_TYPES, MOTOR_TYPE_OPTIONS } from '../utils/codificationUtils';
import type { MotorType } from '../types';

interface MotorTypeSelectorProps {
    value: MotorType[];
    onChange: (next: MotorType[]) => void;
    disabled?: boolean;
}

export default function MotorTypeSelector({
    value,
    onChange,
    disabled = false,
}: MotorTypeSelectorProps) {
    const isAllEffectively = value.length === 0 || value.length === ALL_MOTOR_TYPES.length;

    const toggleOption = (option: MotorType) => {
        if (disabled) return;
        const exists = value.includes(option);
        const nextSet = new Set(value);
        if (exists) {
            nextSet.delete(option);
        } else {
            nextSet.add(option);
        }
        onChange(ALL_MOTOR_TYPES.filter((t) => nextSet.has(t)));
    };

    return (
        <div className="form-control">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="label-text">Para tipo de motor</span>
                <span
                    className={`badge badge-xs ${
                        isAllEffectively ? 'badge-success badge-outline' : 'badge-info badge-outline'
                    }`}
                >
                    {isAllEffectively ? 'Todos los motores' : `${value.length} seleccionado${value.length > 1 ? 's' : ''}`}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MOTOR_TYPE_OPTIONS.map((opt) => {
                    const checked = value.includes(opt.value);
                    return (
                        <label
                            key={opt.value}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                                checked
                                    ? 'border-primary bg-primary/10 text-base-content font-medium'
                                    : 'border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200/60'
                            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary checkbox-xs shrink-0"
                                checked={checked}
                                onChange={() => toggleOption(opt.value)}
                                disabled={disabled}
                            />
                            <span className="text-sm">{opt.label}</span>
                        </label>
                    );
                })}
            </div>

            <p className="text-xs text-base-content/60 mt-1.5">
                Si no seleccionas ninguno (o seleccionas los 3), el elemento aplicará para todos los motores.
            </p>
        </div>
    );
}
