import React from 'react';
import { EnhancedButton } from './buttons';

// Re-export EnhancedButton as the default Button component
// This restores the missing Button.tsx module
const Button = EnhancedButton;

export default Button;
