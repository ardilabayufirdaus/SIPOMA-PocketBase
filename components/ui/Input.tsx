import React from 'react';
import { EnhancedInput } from './EnhancedComponents';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface InputProps extends React.ComponentProps<typeof EnhancedInput> {}

// Base Input Component
const Input: React.FC<InputProps> = (props) => {
  return <EnhancedInput {...props} />;
};

// Search Input Component
export const SearchInput: React.FC<InputProps> = (props) => {
  return (
    <EnhancedInput
      {...props}
      type="search"
      icon={<MagnifyingGlassIcon className="w-5 h-5" />}
      iconPosition="left"
      placeholder={props.placeholder || 'Search...'}
    />
  );
};

// Password Input Component
export const PasswordInput: React.FC<InputProps> = (props) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <EnhancedInput
        {...props}
        type={showPassword ? 'text' : 'password'}
        icon={
          <button
            type="button"
            onClick={togglePassword}
            className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
          >
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        }
        iconPosition="right"
      />
    </div>
  );
};

// Email Input Component
export const EmailInput: React.FC<InputProps> = (props) => {
  return (
    <EnhancedInput
      {...props}
      type="email"
      icon={<EnvelopeIcon className="w-5 h-5" />}
      iconPosition="left"
    />
  );
};

export default Input;
