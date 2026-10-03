import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg, dur) => showToast(msg, 'success', dur), [showToast]);
  const error = useCallback((msg, dur) => showToast(msg, 'error', dur), [showToast]);
  const warning = useCallback((msg, dur) => showToast(msg, 'warning', dur), [showToast]);
  const info = useCallback((msg, dur) => showToast(msg, 'info', dur), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              bg: 'bg-white',
              border: 'border-emerald-200',
              text: 'text-slate-800',
              iconColor: 'text-emerald-500',
              bar: 'bg-emerald-500'
            },
            error: {
              icon: XCircle,
              bg: 'bg-white',
              border: 'border-red-200',
              text: 'text-slate-800',
              iconColor: 'text-red-500',
              bar: 'bg-red-500'
            },
            warning: {
              icon: AlertTriangle,
              bg: 'bg-white',
              border: 'border-amber-200',
              text: 'text-slate-800',
              iconColor: 'text-amber-500',
              bar: 'bg-amber-500'
            },
            info: {
              icon: Info,
              bg: 'bg-white',
              border: 'border-blue-200',
              text: 'text-slate-800',
              iconColor: 'text-blue-500',
              bar: 'bg-blue-500'
            }
          }[toast.type] || {
            icon: Info,
            bg: 'bg-white',
            border: 'border-slate-200',
            text: 'text-slate-800',
            iconColor: 'text-slate-500',
            bar: 'bg-slate-500'
          };

          const IconComponent = typeConfig.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${typeConfig.border} ${typeConfig.bg} transition-all duration-200 transform translate-y-0 relative overflow-hidden`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeConfig.bar}`} />
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <div className="flex-1 text-sm font-medium text-slate-800 leading-snug">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors -mr-1 -mt-1 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
