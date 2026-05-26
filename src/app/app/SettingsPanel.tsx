"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";

interface Props { restaurant: Restaurant }

export default function SettingsPanel({ restaurant }: Props) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontWeight: 700, fontSize: 20 }}>⚙️ Settings</h2>
      <div className="card" style={{ maxWidth: 520 }}>
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
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>This color is used on guest menus as the brand color.</p>
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          {saved && <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>✅ Settings saved!</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ maxWidth: 160 }}>
            {loading ? "Saving..." : "Save settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
