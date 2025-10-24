// Input validation utilities
export const validators = {
  email: (email: string): { isValid: boolean; error?: string } => {
    if (!email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  },

  password: (password: string): { isValid: boolean; error?: string } => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
      return {
        isValid: false,
        error: 'Password must be at least 6 characters',
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        error: 'Password must be less than 128 characters',
      };
    }

    return { isValid: true };
  },

  required: (value: string, fieldName: string): { isValid: boolean; error?: string } => {
    if (!value?.trim()) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
  },

  minLength: (
    value: string,
    min: number,
    fieldName: string
  ): { isValid: boolean; error?: string } => {
    if (value.length < min) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${min} characters`,
      };
    }

    return { isValid: true };
  },

  maxLength: (
    value: string,
    max: number,
    fieldName: string
  ): { isValid: boolean; error?: string } => {
    if (value.length > max) {
      return {
        isValid: false,
        error: `${fieldName} must be less than ${max} characters`,
      };
    }

    return { isValid: true };
  },

  number: (value: string, fieldName: string): { isValid: boolean; error?: string } => {
    if (isNaN(Number(value))) {
      return { isValid: false, error: `${fieldName} must be a valid number` };
    }

    return { isValid: true };
  },

  positiveNumber: (value: string, fieldName: string): { isValid: boolean; error?: string } => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        error: `${fieldName} must be a positive number`,
      };
    }

    return { isValid: true };
  },
};

// Input sanitization utilities
export const sanitizers = {
  text: (input: string): string => {
    return input?.trim().replace(/[<>]/g, '') || '';
  },

  email: (input: string): string => {
    return input?.trim().toLowerCase() || '';
  },

  number: (input: string): string => {
    return input?.replace(/[^\d.-]/g, '') || '';
  },

  alphanumeric: (input: string): string => {
    return input?.replace(/[^a-zA-Z0-9]/g, '') || '';
  },
};

// Form validation helper
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, Array<(value: any) => { isValid: boolean; error?: string }>>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];

    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.isValid && result.error) {
        errors[field] = result.error;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default validators;
