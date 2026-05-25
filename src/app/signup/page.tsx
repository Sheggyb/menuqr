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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontWeight: 800, fontSize: 24, color: "var(--accent)" }}>MenuQR</span>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Create your free account</p>
        </div>
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>Full name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Anna Svensson" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
