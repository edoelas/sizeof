import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isHighContrast: boolean;
    toggleHighContrast: () => void;
    textSize: 'normal' | 'large' | 'xl';
    cycleTextSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
        const saved = localStorage.getItem('highContrastMode');
        return saved === 'true';
    });

    const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>(() => {
        const saved = localStorage.getItem('textSize');
        return (saved === 'large' || saved === 'xl') ? saved : 'normal';
    });

    useEffect(() => {
        // Update data-theme attribute on document element
        document.documentElement.setAttribute('data-theme', theme);
        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (isHighContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        localStorage.setItem('highContrastMode', String(isHighContrast));
    }, [isHighContrast]);

    useEffect(() => {
        // Clear existing text classes
        document.documentElement.classList.remove('text-large', 'text-xl');

        // Add new class if not normal
        if (textSize === 'large') {
            document.documentElement.classList.add('text-large');
        } else if (textSize === 'xl') {
            document.documentElement.classList.add('text-xl');
        }

        localStorage.setItem('textSize', textSize);
    }, [textSize]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const toggleHighContrast = () => {
        setIsHighContrast(prev => !prev);
    };

    const cycleTextSize = () => {
        setTextSize(prev => {
            if (prev === 'normal') return 'large';
            if (prev === 'large') return 'xl';
            return 'normal';
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isHighContrast, toggleHighContrast, textSize, cycleTextSize }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
