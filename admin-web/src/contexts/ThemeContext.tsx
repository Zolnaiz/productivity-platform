import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'system';
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  // System theme шалгах
  useEffect(() => {
    const updateColorScheme = () => {
      let newColorScheme: ColorScheme = 'light';
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        newColorScheme = prefersDark ? 'dark' : 'light';
      } else {
        newColorScheme = theme;
      }
      
      setColorScheme(newColorScheme);
      document.documentElement.classList.toggle('dark', newColorScheme === 'dark');
      
      // Meta tag шинэчлэх
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          newColorScheme === 'dark' ? '#1f2937' : '#ffffff'
        );
      }
    };

    updateColorScheme();

    // System theme өөрчлөгдөхөд сонсох
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateColorScheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Theme хадгалах
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Theme солих
  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  }, []);

  // Theme тогтоох
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const value: ThemeContextType = {
    theme,
    colorScheme,
    isDarkMode: colorScheme === 'dark',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};