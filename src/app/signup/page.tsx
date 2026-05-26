"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
  if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
  if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" };
  return { level: 4, label: "Strong", color: "#22c55e" };
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const strength = getPasswordStrength(password);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/app");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF8", fontFamily: "Inter, system-ui, sans-serif", padding: 16 }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <div style={{ position: "fixed", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(232,93,47,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(232,93,47,0.05)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, background: "white", borderRadius: 20, padding: "40px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid #f0f0ef" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#E85D2F", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontWeight: 900, fontSize: 26, color: "#E85D2F", letterSpacing: "-0.5px", marginBottom: 4 }}>MenuQR</div>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Create your free account — no credit card needed</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "#374151" }}>Full name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Anna Svensson"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "#374151" }}>Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "#374151" }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} style={{ flex: 1, height: 4, borderRadius: 99, background: n <= strength.level ? strength.color : "#e5e7eb", transition: "background 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>{strength.label}</div>
              </div>
            )}
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#E85D2F", color: "white", border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15, opacity: loading ? 0.75 : 1, marginTop: 4 }}>
            {loading ? "Creating account…" : "Create free account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#E85D2F", fontWeight: 700, textDecoration: "none" }}>Log in</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#d1d5db" }}>
          Free forever • No credit card • Cancel anytime
        </p>
      </div>
    </div>
  );
}
