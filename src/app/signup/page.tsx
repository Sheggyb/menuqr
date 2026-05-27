     1|"use client";
     2|import { useState } from "react";
     3|import { useRouter } from "next/navigation";
     4|import { createClient } from "@/lib/supabase/client";
     5|import Link from "next/link";
     6|
     7|function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
     8|  if (pw.length === 0) return { level: 0, label: "", color: "#e5e7eb" };
     9|  let score = 0;
    10|  if (pw.length >= 8) score++;
    11|  if (/[A-Z]/.test(pw)) score++;
    12|  if (/[0-9]/.test(pw)) score++;
    13|  if (/[^A-Za-z0-9]/.test(pw)) score++;
    14|  if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
    15|  if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
    16|  if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" };
    17|  return { level: 4, label: "Strong", color: "#22c55e" };
    18|}
    19|
    20|export default function SignupPage() {
    21|  const [email, setEmail] = useState("");
    22|  const [password, setPassword] = useState("");
    23|  const [name, setName] = useState("");
    24|  const [error, setError] = useState("");
    25|  const [loading, setLoading] = useState(false);
    26|  const router = useRouter();
    27|  const strength = getPasswordStrength(password);
    28|
    29|  async function handleSignup(e: React.FormEvent) {
    30|    e.preventDefault();
    31|    setLoading(true);
    32|    setError("");
    33|    const supabase = createClient();
    34|    const { error } = await supabase.auth.signUp({
    35|      email,
    36|      password,
    37|      options: { data: { full_name: name } },
    38|    });
    39|    if (error) {
    40|      setError(error.message);
    41|      setLoading(false);
    42|    } else {
    43|      router.push("/app");
    44|    }
    45|  }
    46|
    47|  return (
    48|    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", padding: 16 }}>
    49|      <style>{`* { box-sizing: border-box; }`}</style>
    50|
    51|      <div style={{ position: "fixed", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(232,93,47,0.07)", pointerEvents: "none" }} />
    52|      <div style={{ position: "fixed", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(232,93,47,0.05)", pointerEvents: "none" }} />
    53|
    54|      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid var(--border)" }}>
    55|        <div style={{ textAlign: "center", marginBottom: 32 }}>
    56|          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#E85D2F", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>🍽️</div>
    57|          <div style={{ fontWeight: 900, fontSize: 26, color: "#E85D2F", letterSpacing: "-0.5px", marginBottom: 4 }}>MenuQR</div>
    58|          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Create your free account — no credit card needed</p>
    59|        </div>
    60|
    61|        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    62|          <div>
    63|            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Full name</label>
    64|            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Anna Svensson"
    65|              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
    66|          </div>
    67|          <div>
    68|            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Email address</label>
    69|            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
    70|              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
    71|          </div>
    72|          <div>
    73|            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Password</label>
    74|            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6}
    75|              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
    76|            {password.length > 0 && (
    77|              <div style={{ marginTop: 8 }}>
    78|                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
    79|                  {[1, 2, 3, 4].map(n => (
    80|                    <div key={n} style={{ flex: 1, height: 4, borderRadius: 99, background: n <= strength.level ? strength.color : "#e5e7eb", transition: "background 0.2s" }} />
    81|                  ))}
    82|                </div>
    83|                <div style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>{strength.label}</div>
    84|              </div>
    85|            )}
    86|          </div>
    87|          {error && (
    88|            <div style={{ padding: "10px 14px", background: "var(--card-bill-bg)", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
    89|              ⚠️ {error}
    90|            </div>
    91|          )}
    92|          <button type="submit" disabled={loading}
    93|            style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#E85D2F", color: "white", border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15, opacity: loading ? 0.75 : 1, marginTop: 4 }}>
    94|            {loading ? "Creating account…" : "Create free account →"}
    95|          </button>
    96|        </form>
    97|
    98|        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
    99|          Already have an account?{" "}
   100|          <Link href="/login" style={{ color: "#E85D2F", fontWeight: 700, textDecoration: "none" }}>Log in</Link>
   101|        </p>
   102|        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
   103|          Free forever • No credit card • Cancel anytime
   104|        </p>
   105|      </div>
   106|    </div>
   107|  );
   108|}
   109|