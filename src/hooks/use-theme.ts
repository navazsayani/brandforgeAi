"use client";

import { useTheme as useThemeContext } from '@/contexts/ThemeContext';

// Re-export the theme hook for easier imports
export const useTheme = useThemeContext;

// Additional theme utilities
export function useThemeUtils() {
  const { theme, setTheme, resolvedTheme } = useThemeContext();

  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';
  const isSystem = theme === 'system';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setSystemTheme = () => setTheme('system');

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark,
    isLight,
    isSystem,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  };
}

// Theme-aware class name utility
export function useThemeClasses() {
  const { resolvedTheme } = useThemeContext();

  const getThemeClass = (lightClass: string, darkClass: string) => {
    return resolvedTheme === 'dark' ? darkClass : lightClass;
  };

  const conditionalClass = (condition: boolean, trueClass: string, falseClass: string = '') => {
    return condition ? trueClass : falseClass;
  };

  return {
    resolvedTheme,
    getThemeClass,
    conditionalClass,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}