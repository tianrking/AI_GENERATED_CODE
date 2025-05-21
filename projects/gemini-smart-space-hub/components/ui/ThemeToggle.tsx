
import React from 'react';
import { SunIcon, MoonIcon } from '../../constants'; // Using icons from constants
import { Theme } from '../../types';

interface ThemeToggleProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onThemeChange }) => {
  const toggleTheme = () => {
    onThemeChange(currentTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-text-secondary transition-colors duration-200"
      aria-label={currentTheme === 'light' ? "Switch to dark theme" : "Switch to light theme"}
    >
      {currentTheme === 'light' ? (
        <MoonIcon className="w-6 h-6 text-sky-500" />
      ) : (
        <SunIcon className="w-6 h-6 text-yellow-400" />
      )}
    </button>
  );
};

export default ThemeToggle;
