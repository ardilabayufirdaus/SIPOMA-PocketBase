import React, {
  useState,
  useCallback,
  useContext,
  createContext,
  ReactNode,
  useRef,
  useEffect,
} from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  isVisible?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCounter = 0;
const generateToastId = () => `toast-${++toastCounter}`;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = generateToastId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      isVisible: true,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      const hideTimeout = setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isVisible: false } : t))
        );

        // Remove from array after animation
        const removeTimeout = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          timeoutsRef.current.delete(id);
          timeoutsRef.current.delete(`${id}-remove`);
        }, 300);

        timeoutsRef.current.set(`${id}-remove`, removeTimeout);
      }, newToast.duration);

      timeoutsRef.current.set(id, hideTimeout);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    // Clear existing timeouts for this toast
    const hideTimeout = timeoutsRef.current.get(id);
    const removeTimeout = timeoutsRef.current.get(`${id}-remove`);
    if (hideTimeout) clearTimeout(hideTimeout);
    if (removeTimeout) clearTimeout(removeTimeout);

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVisible: false } : t))
    );

    const newRemoveTimeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current.delete(`${id}-remove`);
    }, 300);

    timeoutsRef.current.set(`${id}-remove`, newRemoveTimeout);
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, isVisible: false })));
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message, duration: 7000 });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message });
    },
    [addToast]
  );

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default useToast;
