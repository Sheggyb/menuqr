"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";

interface Props {
  userId: string;
  onCreated: (r: Restaurant) => void;
}

export default function SetupRestaurant({ userId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ owner_id: userId, name, slug, accent_color: "#E85D2F" })
      .select()
      .single();
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onCreated(data as Restaurant);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div className="card" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏪</div>
          <h1 style={{ fontWeight: 700, fontSize: 22 }}>Set up your restaurant</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>You only need to do this once.</p>
        </div>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>Restaurant name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Café Bella"
            />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create restaurant →"}
          </button>
        </form>
      </div>
    </div>
  );
}
