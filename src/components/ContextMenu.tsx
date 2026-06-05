"use client";
import { useEffect, useRef } from "react";

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

  // Adjust position so menu never goes off-screen
  const safeX = typeof window !== "undefined" ? Math.min(x, window.innerWidth - 200) : x;
  const safeY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - items.length * 38 - 16) : y;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {/* Invisible backdrop — click anywhere outside to close */}
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
    </>
  );
}
