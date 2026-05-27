     1|"use client";
     2|import { useState, Suspense } from "react";
     3|import { useSearchParams, useRouter } from "next/navigation";
     4|import { createClient } from "@/lib/supabase/client";
     5|import Link from "next/link";
     6|
     7|function LoginForm() {
     8|  const [email, setEmail] = useState("");
     9|  const [password, setPassword] = useState("");
    10|  const [rememberMe, setRememberMe] = useState(false);
    11|  const [error, setError] = useState("");
    12|  const [loading, setLoading] = useState(false);
    13|  const router = useRouter();
    14|  const searchParams = useSearchParams();
    15|
    16|  async function handleLogin(e: React.FormEvent) {
    17|    e.preventDefault();
    18|    setLoading(true);
    19|    setError("");
    20|    const supabase = createClient();
    21|    const { error } = await supabase.auth.signInWithPassword({ email, password });
    22|    if (error) {
    23|      setError(error.message);
    24|      setLoading(false);
    25|    } else {
    26|      if (rememberMe) {
    27|        try { localStorage.setItem("menuqr_remember_email", email); } catch { /* ignore */ }
    28|      } else {
    29|        try { localStorage.removeItem("menuqr_remember_email"); } catch { /* ignore */ }
    30|      }
    31|      router.push(searchParams.get("redirectTo") || "/app");
    32|    }
    33|  }
    34|
    35|  return (
    36|    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", padding: 16 }}>
    37|      <style>{`
    38|        * { box-sizing: border-box; }
    39|        .login-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; borderRadius: 10px; fontSize: 15px; outline: none; transition: border-color 0.15s; fontFamily: inherit; }
    40|        .login-input:focus { border-color: #E85D2F; box-shadow: 0 0 0 3px rgba(232,93,47,0.12); }
    41|      `}</style>
    42|
    43|      {/* Background decorations */}
    44|      <div style={{ position: "fixed", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(232,93,47,0.07)", pointerEvents: "none" }} />
    45|      <div style={{ position: "fixed", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(232,93,47,0.05)", pointerEvents: "none" }} />
    46|
    47|      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid var(--border)" }}>
    48|        {/* Logo */}
    49|        <div style={{ textAlign: "center", marginBottom: 32 }}>
    50|          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#E85D2F", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>🍽️</div>
    51|          <div style={{ fontWeight: 900, fontSize: 26, color: "#E85D2F", letterSpacing: "-0.5px", marginBottom: 4 }}>MenuQR</div>
    52|          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Welcome back! Log in to your account</p>
    53|        </div>
    54|
    55|        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    56|          <div>
    57|            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Email address</label>
    58|            <input
    59|              className="login-input"
    60|              type="email"
    61|              required
    62|              value={email}
    63|              onChange={e => setEmail(e.target.value)}
    64|              placeholder="you@example.com"
    65|              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }}
    66|            />
    67|          </div>
    68|          <div>
    69|            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Password</label>
    70|            <input
    71|              className="login-input"
    72|              type="password"
    73|              required
    74|              value={password}
    75|              onChange={e => setPassword(e.target.value)}
    76|              placeholder="••••••••"
    77|              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }}
    78|            />
    79|          </div>
    80|          {error && (
    81|            <div style={{ padding: "10px 14px", background: "var(--card-bill-bg)", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
    82|              ⚠️ {error}
    83|            </div>
    84|          )}
    85|          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
    86|            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
    87|              style={{ width: 16, height: 16, accentColor: "#E85D2F", cursor: "pointer" }} />
    88|            Remember me
    89|          </label>
    90|          <button
    91|            type="submit"
    92|            disabled={loading}
    93|            style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#E85D2F", color: "white", border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15, opacity: loading ? 0.75 : 1, transition: "opacity 0.15s", marginTop: 4 }}
    94|          >
    95|            {loading ? "Logging in…" : "Log in →"}
    96|          </button>
    97|        </form>
    98|
    99|        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
   100|          No account yet?{" "}
   101|          <Link href="/signup" style={{ color: "#E85D2F", fontWeight: 700, textDecoration: "none" }}>Sign up free</Link>
   102|        </p>
   103|      </div>
   104|    </div>
   105|  );
   106|}
   107|
   108|export default function LoginPage() {
   109|  return <Suspense><LoginForm /></Suspense>;
   110|}
   111|