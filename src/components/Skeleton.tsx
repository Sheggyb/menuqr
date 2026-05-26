"use client";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s infinite ease-in-out",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="card"
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
      aria-hidden="true"
    >
      <Skeleton height={18} width="60%" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} height={13} width={i === lines - 2 ? "45%" : "90%"} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true" aria-label="Loading…">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </div>
  );
}
