import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'apu_gen_theme';

interface ThemeContextValue {
    theme: ThemeMode;
    isDark: boolean;
    setTheme: (nextTheme: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStoredTheme = (): ThemeMode => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return stored === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

const applyThemeToDocument = (theme: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);

    useEffect(() => {
        applyThemeToDocument(theme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Ignora errores de almacenamiento en modo privado restrictivo
        }
    }, [theme]);

    // Sincroniza el tema entre pestañas y fuerza modo claro únicamente al imprimir
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY) return;
            setThemeState(event.newValue === 'dark' ? 'dark' : 'light');
        };

        const handleBeforePrint = () => {
            applyThemeToDocument('light');
        };

        const handleAfterPrint = () => {
            applyThemeToDocument(readStoredTheme());
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    const setTheme = useCallback((nextTheme: ThemeMode) => {
        setThemeState(nextTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value: ThemeContextValue = {
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe utilizarse dentro de un ThemeProvider.');
    }
    return context;
}
