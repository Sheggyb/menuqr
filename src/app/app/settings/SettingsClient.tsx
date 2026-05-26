"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import Link from "next/link";

interface Props { restaurant: Restaurant }

export default function SettingsClient({ restaurant }: Props) {
  const supabase = createClient();
  const [name, setName] = useState(restaurant.name);
  const [accent, setAccent] = useState(restaurant.accent_color || "#E85D2F");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase
      .from("restaurants")
      .update({ name: name.trim(), accent_color: accent })
      .eq("id", restaurant.id);
    setLoading(false);
    if (err) { setError(err.message); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/app" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>← Back to dashboard</Link>
        </div>
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>⚙️ Restaurant Settings</h2>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Restaurant name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Accent color</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
                  style={{ width: 48, height: 40, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: 2 }} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{accent}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, border: "1px solid var(--border)" }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Used as the brand color on guest menus.</p>
            </div>
            {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
            {saved && <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>✅ Settings saved!</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
