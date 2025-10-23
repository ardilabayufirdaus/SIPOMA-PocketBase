export const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.trim() !== '';
};

