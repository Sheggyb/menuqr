"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconTrash, IconHelp } from "./icons";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>(resolve => {
      // If a dialog is already open, cancel it first
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  function close(ok: boolean) {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOptions(null);
  }

  // Escape closes the dialog; focus starts on Cancel for destructive actions
  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && typeof document !== "undefined" && createPortal(
        <>
          <style>{`@keyframes modalFadeIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
          <div
            onClick={() => close(false)}
            role="dialog"
            aria-modal="true"
            aria-label={options.title}
            style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "28px 24px", maxWidth: 360, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", animation: "modalFadeIn 0.15s ease" }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: options.danger ? "var(--danger)" : "var(--text-muted)" }}>
                {options.danger ? <IconTrash width={32} height={32} /> : <IconHelp width={32} height={32} />}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "var(--fs-lg)", textAlign: "center", margin: "0 0 8px", color: "var(--text)" }}>
                {options.title}
              </h3>
              {options.message && (
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
                  {options.message}
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: options.message ? 0 : 24 }}>
                <button
                  autoFocus={!!options.danger}
                  onClick={() => close(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
                >Cancel</button>
                <button
                  autoFocus={!options.danger}
                  onClick={() => close(true)}
                  style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", border: "none", background: options.danger ? "#dc2626" : "var(--accent)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "var(--fs-sm)" }}
                >{options.confirmLabel ?? "Confirm"}</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}
