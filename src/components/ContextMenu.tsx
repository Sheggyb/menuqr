"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuAction {
  label: string;
  icon?: string;
  action: () => void;
  danger?: boolean;
  separator?: true;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuAction[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Touch devices (mobile/tablet) → bottom sheet. Desktop → floating menu.
  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || window.navigator.maxTouchPoints > 0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  // ── MOBILE / TABLET: bottom action sheet ─────────────────────────────
  if (isTouch) {
    return createPortal(
      <>
        <style>{`
          @keyframes ctxFadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes ctxSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.45)",
            animation: "ctxFadeIn 0.15s ease",
          }}
        />
        {/* Sheet */}
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
            background: "var(--surface)",
            borderRadius: "20px 20px 0 0",
            paddingBottom: "max(20px, env(safe-area-inset-bottom))",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.3)",
            animation: "ctxSlideUp 0.22s ease",
          }}
        >
          {/* Pull handle */}
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: "var(--border)",
            margin: "12px auto 16px",
          }} />

          {/* Actions */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {items.map((item, i) =>
              item.separator ? (
                <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.action(); onClose(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    width: "100%",
                    padding: "15px 24px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: item.danger ? "#dc2626" : "var(--text)",
                    textAlign: "left",
                    fontSize: 16,
                    fontWeight: item.danger ? 600 : 400,
                  }}
                >
                  {item.icon && (
                    <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              )
            )}
          </div>

          {/* Cancel */}
          <div style={{ padding: "8px 16px 0" }}>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 16,
                color: "var(--text-muted)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </>,
      document.body
    );
  }

  // ── DESKTOP: floating context menu ───────────────────────────────────
  const safeX = Math.min(x, window.innerWidth - 200);
  const safeY = Math.min(y, window.innerHeight - items.length * 38 - 16);

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: safeY,
          left: safeX,
          zIndex: 9999,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          minWidth: 188,
          padding: "4px 0",
          userSelect: "none",
        }}
      >
        {items.map((item, i) =>
          item.separator ? (
            <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          ) : (
            <button
              key={i}
              onClick={() => { item.action(); onClose(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "8px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: item.danger ? "#dc2626" : "var(--text)",
                textAlign: "left",
                fontSize: 13,
                fontWeight: item.danger ? 600 : 400,
                transition: "background 0.08s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2, #1a1a20)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {item.icon && (
                <span style={{ fontSize: 14, opacity: 0.75, width: 18, textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          )
        )}
      </div>
    </>,
    document.body
  );
}
