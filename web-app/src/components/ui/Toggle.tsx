import React from 'react';
import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
  children,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const sizeClasses = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <label className={clsx('flex items-center cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          onClick={handleClick}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={clsx(
            'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
            currentSize.track,
            checked
              ? 'bg-primary-600'
              : 'bg-gray-200',
            disabled && 'opacity-50'
          )}
        >
          <span
            className={clsx(
              'inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out',
              currentSize.thumb,
              checked ? currentSize.translate : 'translate-x-0.5'
            )}
          />
        </div>
      </div>
      {children && (
        <span className={clsx('ml-3 text-sm font-medium', disabled ? 'text-gray-400' : 'text-gray-700')}>
          {children}
        </span>
      )}
    </label>
  );
};