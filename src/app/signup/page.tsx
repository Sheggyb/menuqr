"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { IconDish, IconAlert, IconMail } from "@/components/icons";

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
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const strength = getPasswordStrength(password);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      // Email confirmations are disabled — user is immediately active
      router.push("/app");
    } else {
      // Email confirmation required — tell the user to check their inbox
      setEmailSent(true);
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-body)", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "48px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--success)", marginBottom: 20 }}><IconMail width={30} height={30} /></div>
          <h1 style={{ fontWeight: 700, fontSize: "var(--fs-xl)", marginBottom: 10 }}>Check your email</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: "var(--text)" }}>{email}</strong>.<br />
            Click it to activate your account and get started.
          </p>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Wrong address?{" "}
            <button onClick={() => setEmailSent(false)} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "var(--fs-sm)" }}>
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-body)", padding: 16 }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <div style={{ position: "fixed", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "var(--accent)", opacity: 0.06, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "var(--accent)", opacity: 0.04, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "40px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid var(--border)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 12 }}><IconDish width={26} height={26} /></div>
          <div style={{ fontWeight: 900, fontSize: "var(--fs-xl)", color: "var(--accent)", letterSpacing: "-0.5px", marginBottom: 4 }}>MenuQR</div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", margin: 0 }}>Create your free account — no credit card needed</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Full name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Anna Svensson"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--fs-md)", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--fs-md)", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--fs-md)", outline: "none", fontFamily: "inherit" }} />
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} style={{ flex: 1, height: 4, borderRadius: "var(--radius-pill)", background: n <= strength.level ? strength.color : "var(--border)", transition: "background 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: strength.color, fontWeight: 600 }}>{strength.label}</div>
              </div>
            )}
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)", color: "#dc2626", fontSize: "var(--fs-sm)", fontWeight: 500 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><IconAlert width={15} height={15} style={{ flexShrink: 0 }} /> {error}</span>
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: "var(--fs-md)", opacity: loading ? 0.75 : 1, marginTop: 4 }}>
            {loading ? "Creating account…" : "Create free account →"}
          </button>
          <p style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            By creating an account you agree to our{" "}
            <Link href="/terms" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>.
          </p>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>Log in</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          Free forever • No credit card • Cancel anytime
        </p>
      </div>
    </div>
  );
}
