import { useState, useCallback } from 'react';

type ConfirmationResult = boolean | null;

interface ConfirmationOptions {
  title: string;
  message: string;
}

const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationResult>(null);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(options);
      setConfirmationState(null); // Reset previous result
      
      // This is a simplified implementation. In a real app, you'd
      // show a modal here and resolve the promise based on user interaction.
      const result = window.confirm(`${options.title}\n\n${options.message}`);
      resolve(result);
      setOptions(null);
    });
  }, []);

  return { confirm };
};

export default useConfirmation;
