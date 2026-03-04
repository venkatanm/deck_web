import { useState, createContext, useContext, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 2500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium
              flex items-center gap-2 pointer-events-auto
              transition-all duration-200
              ${toast.type === "error" ? "bg-red-600 text-white" : ""}
              ${toast.type === "success" ? "bg-gray-900 text-white" : ""}
              ${toast.type === "info" ? "bg-blue-600 text-white" : ""}
              ${toast.type === "warning" ? "bg-amber-500 text-white" : ""}
            `}
          >
            {toast.type === "success" && <span>✓</span>}
            {toast.type === "error" && <span>✕</span>}
            {toast.type === "info" && <span>ℹ</span>}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
