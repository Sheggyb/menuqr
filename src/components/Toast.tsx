"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconAlert, IconCheckCircle } from "./icons";

interface ToastItem {
  id: number;
  kind: "success" | "error";
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastItem["kind"], message: string) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const api = useRef<ToastApi>({
    success: (m: string) => push("success", m),
    error: (m: string) => push("error", m),
  });
  // keep push reference fresh (push is stable, so this is fine)
  api.current.success = (m: string) => push("success", m);
  api.current.error = (m: string) => push("error", m);

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <>
          <style>{`@keyframes toastUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            zIndex: 10000, pointerEvents: "none", maxWidth: "calc(100vw - 32px)",
          }}>
            {toasts.map(t => (
              <div
                key={t.id}
                role="status"
                aria-live="polite"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--surface)",
                  border: `1px solid ${t.kind === "error" ? "#dc262655" : "#22c55e55"}`,
                  borderLeft: `3px solid ${t.kind === "error" ? "#dc2626" : "#22c55e"}`,
                  color: "var(--text)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  animation: "toastUp 0.2s ease-out",
                  pointerEvents: "auto",
                }}
              >
                <span aria-hidden="true" style={{ display: "inline-flex", color: t.kind === "error" ? "var(--danger)" : "var(--success)", flexShrink: 0 }}>
                  {t.kind === "error" ? <IconAlert width={15} height={15} /> : <IconCheckCircle width={15} height={15} />}
                </span>
                {t.message}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
