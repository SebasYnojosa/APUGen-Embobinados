import type { MouseEvent } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
    showLabel?: boolean;
    className?: string;
}

export default function ThemeToggle({
    showLabel = false,
    className = '',
}: ThemeToggleProps) {
    const { isDark, toggleTheme } = useTheme();
    const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

    const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        toggleTheme({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        });
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            title={label}
            aria-label={label}
            className={`btn btn-ghost btn-sm ${showLabel ? 'gap-2' : 'btn-circle'} ${className}`.trim()}
        >
            <span className="relative inline-flex items-center justify-center w-5 h-5">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 text-warning absolute transition-all duration-300 ease-out ${
                        isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden={!isDark}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 absolute transition-all duration-300 ease-out ${
                        isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden={isDark}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            </span>
            {showLabel && (
                <span className="text-xs font-medium">
                    {isDark ? 'Modo claro' : 'Modo oscuro'}
                </span>
            )}
        </button>
    );
}
