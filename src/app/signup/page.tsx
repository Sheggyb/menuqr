"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#E85D2F", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontWeight: 900, fontSize: 26, color: "#E85D2F", letterSpacing: "-0.5px", marginBottom: 4 }}>MenuQR</div>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Create your free account — no credit card needed</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Full name", type: "text", value: name, onChange: setName, placeholder: "Anna Svensson", min: undefined },
            { label: "Email address", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com", min: undefined },
            { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "Min 6 characters", min: 6 },
          ].map(field => (
            <div key={field.label}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "#374151" }}>{field.label}</label>
              <input
                type={field.type}
                required
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                minLength={field.min}
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }}
              />
            </div>
          ))}
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#E85D2F", color: "white", border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15, opacity: loading ? 0.75 : 1, marginTop: 4 }}
          >
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
