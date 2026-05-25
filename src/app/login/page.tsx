"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(searchParams.get("redirectTo") || "/app");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontWeight: 800, fontSize: 24, color: "var(--accent)" }}>MenuQR</span>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Log in to your account</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
          No account? <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
