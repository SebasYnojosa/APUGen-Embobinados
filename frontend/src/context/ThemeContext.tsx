import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type ThemeMode = 'light' | 'dark';

export interface ThemeTransitionOrigin {
    x: number;
    y: number;
}

interface ViewTransitionLike {
    ready: Promise<void>;
}

type DocumentWithViewTransition = Document & {
    startViewTransition?: (updateCallback: () => void) => ViewTransitionLike;
};

const THEME_STORAGE_KEY = 'apu_gen_theme';
const THEME_TRANSITION_CLASS = 'theme-transitioning';

interface ThemeContextValue {
    theme: ThemeMode;
    isDark: boolean;
    setTheme: (nextTheme: ThemeMode, origin?: ThemeTransitionOrigin) => void;
    toggleTheme: (origin?: ThemeTransitionOrigin) => void;
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
    const themeRef = useRef<ThemeMode>(theme);
    const fallbackTimerRef = useRef<number | null>(null);

    useEffect(() => {
        themeRef.current = theme;
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
            if (fallbackTimerRef.current !== null) {
                window.clearTimeout(fallbackTimerRef.current);
            }
        };
    }, []);

    const transitionToTheme = useCallback((nextTheme: ThemeMode, origin?: ThemeTransitionOrigin) => {
        if (nextTheme === themeRef.current) return;

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            themeRef.current = nextTheme;
            setThemeState(nextTheme);
            applyThemeToDocument(nextTheme);
            return;
        }

        const doc = document as DocumentWithViewTransition;
        if (typeof doc.startViewTransition === 'function') {
            const x = origin?.x ?? window.innerWidth / 2;
            const y = origin?.y ?? window.innerHeight / 2;
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            const transition = doc.startViewTransition(() => {
                themeRef.current = nextTheme;
                flushSync(() => {
                    setThemeState(nextTheme);
                });
                applyThemeToDocument(nextTheme);
            });

            transition.ready
                .then(() => {
                    document.documentElement.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${endRadius}px at ${x}px ${y}px)`,
                            ],
                        },
                        {
                            duration: 450,
                            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                            pseudoElement: '::view-transition-new(root)',
                        }
                    );
                })
                .catch(() => {
                    // Ignora cancelaciones si el usuario alterna el tema rápidamente
                });
            return;
        }

        // Fallback con transición CSS para navegadores sin View Transitions API
        const root = document.documentElement;
        if (fallbackTimerRef.current !== null) {
            window.clearTimeout(fallbackTimerRef.current);
        }
        root.classList.add(THEME_TRANSITION_CLASS);
        themeRef.current = nextTheme;
        setThemeState(nextTheme);
        applyThemeToDocument(nextTheme);
        fallbackTimerRef.current = window.setTimeout(() => {
            root.classList.remove(THEME_TRANSITION_CLASS);
            fallbackTimerRef.current = null;
        }, 380);
    }, []);

    const setTheme = useCallback(
        (nextTheme: ThemeMode, origin?: ThemeTransitionOrigin) => {
            transitionToTheme(nextTheme, origin);
        },
        [transitionToTheme]
    );

    const toggleTheme = useCallback(
        (origin?: ThemeTransitionOrigin) => {
            const nextTheme: ThemeMode = themeRef.current === 'dark' ? 'light' : 'dark';
            transitionToTheme(nextTheme, origin);
        },
        [transitionToTheme]
    );

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
