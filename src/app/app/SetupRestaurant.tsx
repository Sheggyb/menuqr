"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { DEFAULT_ACCENT } from "@/lib/constants";
import { IconStore } from "@/components/icons";
import { useT } from "@/lib/i18n/client";

interface Props {
  userId: string;
  onCreated: (r: Restaurant) => void;
}

export default function SetupRestaurant({ userId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useT();

  function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlug(slugify(val));
  }

  function handleSlugChange(val: string) {
    setSlugEdited(true);
    setSlug(slugify(val));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) { setError(t("setup.error.nameRequired")); setLoading(false); return; }
    let base = slug || slugify(trimmedName);
    // Non-Latin names slugify to "" — fall back to a generated slug
    if (!base) base = `restaurant-${Math.random().toString(36).slice(2, 8)}`;
    const supabase = createClient();
    // Retry on slug collision (unique constraint) with a short random suffix
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from("restaurants")
        .insert({ owner_id: userId, name: trimmedName, slug: candidate, accent_color: DEFAULT_ACCENT })
        .select()
        .single();
      if (!error) { onCreated(data as Restaurant); return; }
      if (!/duplicate/i.test(error.message)) {
        setError(t("setup.error.create"));
        setLoading(false);
        return;
      }
      // duplicate slug — loop and retry with a new suffix
    }
    setError(t("setup.error.taken"));
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div className="card" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ marginBottom: 10, color: "var(--accent)", display: "flex", justifyContent: "center" }}><IconStore width={42} height={42} /></div>
          <h1 style={{ fontWeight: 700, fontSize: "var(--fs-xl)" }}>{t("setup.title")}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginTop: 4 }}>{t("setup.subtitle")}</p>
        </div>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 4, display: "block" }}>{t("setup.name.label")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder={t("setup.name.placeholder")}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 4, display: "block" }}>{t("setup.slug.label")}</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder={t("setup.slug.placeholder")}
                style={{ paddingLeft: 8 }}
              />
            </div>
            {slug && (
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: 3 }}>
                {t("setup.slug.hint")}
              </p>
            )}
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: "var(--fs-sm)" }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t("setup.creating") : t("setup.create")}
          </button>
        </form>
      </div>
    </div>
  );
}
