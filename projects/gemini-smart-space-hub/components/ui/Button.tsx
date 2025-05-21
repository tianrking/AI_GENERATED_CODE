
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out inline-flex items-center justify-center";
  
  const variantStyles = {
    primary: `bg-brand-primary hover:bg-brand-secondary text-white focus:ring-brand-primary`,
    secondary: `bg-slate-200 hover:bg-slate-300 text-brand-text-primary dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-brand-text-secondary focus:ring-slate-500`,
    danger: `bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`,
    ghost: `bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-primary focus:ring-brand-primary`,
    outline: `bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white focus:ring-brand-primary dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-400 dark:hover:text-slate-900`
  };

  const sizeStyles = {
    sm: `px-3 py-1.5 text-xs`,
    md: `px-4 py-2 text-sm`,
    lg: `px-6 py-3 text-base`,
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading || disabled ? disabledStyles : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2 h-5 w-5">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2 h-5 w-5">{rightIcon}</span>}
    </button>
  );
};

export default Button;
