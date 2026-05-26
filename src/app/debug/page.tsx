export default function DebugPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h2>Env Check</h2>
      <p>SUPABASE_URL: {url ? `✅ set (${url.slice(0, 30)}...)` : "❌ MISSING"}</p>
      <p>ANON_KEY: {key ? `✅ set (${key.slice(0, 20)}...)` : "❌ MISSING"}</p>
      <p>APP_URL: {appUrl ? `✅ ${appUrl}` : "❌ MISSING"}</p>
    </div>
  );
}
