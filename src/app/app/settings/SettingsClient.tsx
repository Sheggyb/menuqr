"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props { restaurant: Restaurant }

export default function SettingsClient({ restaurant }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(restaurant.name);
  const [accent, setAccent] = useState(restaurant.accent_color || "#E85D2F");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleteInput !== restaurant.name) return;
    setDeleting(true);
    await supabase.from("restaurant_tables").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("menu_items").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("menu_categories").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("table_requests").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("restaurants").delete().eq("id", restaurant.id);
    setDeleting(false);
    router.push("/app");
  }
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("menuqr_sound") !== "off";
  });

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("menuqr_sound", next ? "on" : "off");
    // Play a test beep if turning on
    if (next) {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.value = 0.15;
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } catch { /* ignore */ }
    }
  }

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
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
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

        {/* Notification settings */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🔔 Notifications</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Sound alerts</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Play an audio ping when a new order comes in</div>
            </div>
            <button
              onClick={toggleSound}
              style={{
                width: 52, height: 28, borderRadius: 99,
                background: soundEnabled ? "#E85D2F" : "#d1d5db",
                border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s",
              }}
              aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
              aria-pressed={soundEnabled}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "white",
                position: "absolute", top: 3, left: soundEnabled ? 27 : 3,
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
            Sound setting is stored in your browser. Each device needs to enable it separately.
          </p>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ border: "1px solid #fecaca" }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#dc2626" }}>⚠️ Danger Zone</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Permanently delete this restaurant and all its data. This cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #dc2626", background: "white", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              🗑️ Delete restaurant
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, margin: 0 }}>
                Type <strong>{restaurant.name}</strong> to confirm deletion:
              </p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={restaurant.name}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid #dc2626", fontSize: 14 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== restaurant.name || deleting}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: deleteInput === restaurant.name ? "#dc2626" : "#f3f4f6", color: deleteInput === restaurant.name ? "white" : "#9ca3af", fontWeight: 700, fontSize: 13, cursor: deleteInput === restaurant.name ? "pointer" : "default" }}
                >
                  {deleting ? "Deleting..." : "Yes, delete permanently"}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                  style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
