import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    onClose(id);
  };

  const toastConfig = {
    success: {
      bgColor: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-white'
    },
    error: {
      bgColor: 'bg-red-500',
      icon: XCircle,
      iconColor: 'text-white'
    }
  };

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={`
        ${config.bgColor} text-white px-6 py-4 rounded-lg shadow-lg
        flex items-center space-x-3 min-w-[300px] max-w-[400px]
        backdrop-blur-md bg-opacity-90
      `}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="text-white/80 hover:text-white transition-colors p-1"
        aria-label="關閉通知"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    message: string;
  }>;
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={onRemoveToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: ToastType;
    message: string;
  }>>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message: string) => addToast('success', message);
  const error = (message: string) => addToast('error', message);

  return {
    toasts,
    removeToast,
    success,
    error
  };
}; 