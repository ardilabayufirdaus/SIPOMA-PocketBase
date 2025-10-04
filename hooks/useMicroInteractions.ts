import { useState, useCallback, useEffect } from 'react';

export interface MicroInteractionConfig {
  scale?: number;
  rotate?: number;
  translateX?: number;
  translateY?: number;
  duration?: number;
  easing?: string;
  haptic?: boolean;
}

export const useMicroInteraction = (config: MicroInteractionConfig = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const {
    scale = 1.05,
    rotate = 0,
    translateX = 0,
    translateY = -2,
    duration = 150,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    haptic = false,
  } = config;

  const trigger = useCallback(() => {
    setIsActive(true);

    // Trigger haptic feedback if supported
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Reset after animation
    setTimeout(() => {
      setIsActive(false);
    }, duration);
  }, [duration, haptic]);

  useEffect(() => {
    if (isActive) {
      setStyle({
        transform: `scale(${scale}) rotate(${rotate}deg) translate(${translateX}px, ${translateY}px)`,
        transition: `transform ${duration}ms ${easing}`,
      });
    } else {
      setStyle({
        transform: 'scale(1) rotate(0deg) translate(0px, 0px)',
        transition: `transform ${duration}ms ${easing}`,
      });
    }
  }, [isActive, scale, rotate, translateX, translateY, duration, easing]);

  return { style, trigger, isActive };
};

// Hook for button micro-interactions
export const useButtonInteraction = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);
  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
    setIsHovered(false);
  }, []);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const style: React.CSSProperties = {
    transform: isPressed ? 'scale(0.98)' : isHovered ? 'scale(1.02)' : 'scale(1)',
    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return {
    style,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onMouseEnter: handleMouseEnter,
    },
    states: { isPressed, isHovered },
  };
};

// Hook for card hover effects
export const useCardInteraction = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const style: React.CSSProperties = {
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return {
    style,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    isHovered,
  };
};

// Hook for input focus effects
export const useInputInteraction = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setHasValue(e.target.value.length > 0);
    },
    []
  );

  const containerStyle: React.CSSProperties = {
    transform: isFocused ? 'scale(1.02)' : 'scale(1)',
    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const inputStyle: React.CSSProperties = {
    borderColor: isFocused ? 'var(--color-primary-500)' : 'var(--color-neutral-300)',
    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return {
    containerStyle,
    inputStyle,
    handlers: {
      onFocus: handleFocus,
      onBlur: handleBlur,
      onChange: handleChange,
    },
    states: { isFocused, hasValue },
  };
};

// Hook for loading states with micro-interactions
export const useLoadingInteraction = (isLoading: boolean) => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Delay showing loader to prevent flash for fast operations
      const timer = setTimeout(() => setShowLoader(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  const style: React.CSSProperties = {
    opacity: showLoader ? 1 : 0,
    transform: showLoader ? 'scale(1)' : 'scale(0.8)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return { style, showLoader };
};

// Hook for success/error feedback
export const useFeedbackInteraction = () => {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });

  const showFeedback = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setFeedback({ type, message });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 3000);
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback({ type: null, message: '' });
  }, []);

  const style: React.CSSProperties = {
    transform: feedback.type ? 'translateY(0)' : 'translateY(-100%)',
    opacity: feedback.type ? 1 : 0,
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return {
    feedback,
    style,
    showFeedback,
    clearFeedback,
  };
};
