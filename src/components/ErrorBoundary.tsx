"use client";
import React from "react";

interface State { hasError: boolean; error: Error | null; retryCount: number }
interface Props { children: React.ReactNode; fallbackTitle?: string }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState(s => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", textAlign: "center", gap: 16,
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
            {this.props.fallbackTitle ?? "Something went wrong"}
          </p>
          {this.state.error && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", maxWidth: 360, wordBreak: "break-word" }}>
              {this.state.error.message}
            </p>
          )}
        </div>
        <button
          onClick={this.handleRetry}
          style={{
            padding: "9px 22px", borderRadius: 8, background: "#E85D2F", color: "white",
            border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}
        >
          ↻ Retry
        </button>
        {this.state.retryCount > 2 && (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Still failing? Try refreshing the page.
          </p>
        )}
      </div>
    );
  }
}
