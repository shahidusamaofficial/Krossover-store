"use client";

import { useState, useEffect } from "react";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("krossover_admin_token") || "";
}

export default function NewProductPage() {
  const [token, setTokenState] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [designs, setDesigns] = useState([]);
  const [blanks, setBlanks] = useState([]);

  const [designId, setDesignId] = useState("");
  const [blankId, setBlankId] = useState("");
  const [variations, setVariations] = useState([]);
  const [pickedVars, setPickedVars] = useState({});
  const [sizeLabels, setSizeLabels] = useState({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const t = getToken();
    if (t) { setTokenState(t); loadForm(t); } else { setLoading(false); }
  }, []);

  async function loadForm(t) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", { headers: { Authorization: `Bearer ${t}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setDesigns(j.designs || []);
      setBlanks(j.blanks || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function onBlankChange(id) {
    setBlankId(id);
    setVariations([]); setPickedVars({}); setSizeLabels({});
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/products?blank_id=${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setVariations(j.blank?.variations || []);
      const picked = {}; const labels = {};
      (j.blank?.variations || []).forEach((v) => {
        picked[v.variation_id] = true;
        labels[v.variation_id] = v.size || v.label?.split(" / ").pop() || "M";
      });
      setPickedVars(picked); setSizeLabels(labels);
    } catch (e) { setError(e.message); }
  }

  function onNameChange(v) {
    setName(v);
    if (!slug) setSlug(v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  async function submit(e) {
    e.preventDefault();
    setError(""); setResult(null);
    const chosen = variations.filter((v) => pickedVars[v.variation_id]);
    if (chosen.length === 0) { setError("Pick at least one variation (size/color)."); return; }
    const sizes = chosen.map((v) => sizeLabels[v.variation_id] || "M");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          design_id: Number(designId),
          blank_product_id: Number(blankId),
          variations: chosen.map((v) => ({ variation_id: v.variation_id, label: v.label })),
          name, slug, price_pkr: Number(price), description, sizes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setResult(j);
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 360, margin: "80px auto", padding: 28, background: "#fff", border: "1px solid #e2e2dd", borderRadius: 8, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 18 }}>Admin sign in</h1>
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: 13 }}>Enter the ADMIN_TOKEN you set in Vercel env vars.</p>
        <form onSubmit={(e) => { e.preventDefault(); setTokenState(tokenInput.trim()); loadForm(tokenInput.trim()); }}>
          <div style={{ marginBottom: 14 }}>
            <input type="password" placeholder="ADMIN_TOKEN" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} autoFocus style={{ width: "100%", padding: "8px 10px", border: "1px solid #d4d4cf", borderRadius: 5, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{ padding: "10px 18px", background: "#111", color: "#fff", border: "none", borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign in</button>
        </form>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20, color: "#888", fontFamily: "system-ui" }}>Loading designs and blank catalog…</div>;

  const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #d4d4cf", borderRadius: 5, fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };
  const cardStyle = { background: "#fff", border: "1px solid #e2e2dd", borderRadius: 8, padding: 24, marginBottom: 20, fontFamily: "system-ui, sans-serif" };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>Publish a product</h1>
      <p style={{ color: "#777", margin: "0 0 20px", fontSize: 13 }}>
        Pick a design you already uploaded to CeePrinto, choose a blank and the sizes you want to sell, set your price, and click Publish.
      </p>

      {error && <div style={{ background: "#fbe9e7", border: "1px solid #ffab91", color: "#b71c1c", padding: "12px 16px", borderRadius: 6, marginBottom: 16, wordBreak: "break-word" }}>{error}</div>}
      {result && (
        <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", color: "#1b5e20", padding: "12px 16px", borderRadius: 6, marginBottom: 16 }}>
          <strong>Published!</strong> Product <code>{result.slug}</code> is live.{" "}
          <a href={result.store_url} target="_blank" style={{ color: "#1b5e20" }}>View it ↗</a>
          {result.shop_hint && <div style={{ marginTop: 8, fontSize: 13 }}>{result.shop_hint}</div>}
          {result.ceeprinto_listings_failed > 0 && <div style={{ marginTop: 8 }}>⚠ {result.ceeprinto_listings_failed} listing(s) failed.</div>}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>1 · CeePrinto design</h2>
          <p style={{ color: "#777", fontSize: 12, margin: "0 0 16px" }}>
            Designs you saved in CeePrinto&apos;s Design Configurator. To add a new one, upload your PNG at ceeprinto.com → Design Configurator → Save, then refresh this page.
          </p>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Design</label>
            <select value={designId} onChange={(e) => setDesignId(e.target.value)} required style={inputStyle}>
              <option value="">— pick a design —</option>
              {designs.map((d) => (<option key={d.id} value={d.id}>{d.name} (#{d.id})</option>))}
            </select>
          </div>
          {designs.length === 0 && (
            <p style={{ color: "#b71c1c", fontSize: 13 }}>No designs found. Upload a PNG in CeePrinto&apos;s Design Configurator first.</p>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>2 · Blank product &amp; sizes</h2>
          <p style={{ color: "#777", fontSize: 12, margin: "0 0 16px" }}>The garment CeePrinto will print on. Variations are the sizes/colors you can offer.</p>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Blank product</label>
            <select value={blankId} onChange={(e) => onBlankChange(e.target.value)} required style={inputStyle}>
              <option value="">— pick a blank —</option>
              {blanks.map((b) => (
                <option key={b.id} value={b.id}>{b.name} (#{b.id}){b.variation_count ? ` · ${b.variation_count} variations` : " · simple"}</option>
              ))}
            </select>
          </div>
          {variations.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Variations to offer (edit the size label per row)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {variations.map((v) => (
                  <label key={v.variation_id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "1px solid #d4d4cf", borderRadius: 5, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!pickedVars[v.variation_id]} onChange={(e) => setPickedVars({ ...pickedVars, [v.variation_id]: e.target.checked })} />
                    <span>{v.label}</span>
                    <input type="text" value={sizeLabels[v.variation_id] || ""} onChange={(e) => setSizeLabels({ ...sizeLabels, [v.variation_id]: e.target.value })} style={{ width: 50, padding: "2px 6px", fontSize: 12, border: "1px solid #d4d4cf", borderRadius: 3 }} placeholder="S" />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>3 · Storefront details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Product name</label>
              <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Stay Grounded Tee" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL)</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="stay-grounded-tee" required style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Price (Rs)</label>
              <input type="number" min="100" step="50" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description (optional)</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Olive-green botanical tee, unisex fit." style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="submit" disabled={submitting || !designId || !blankId} style={{ padding: "10px 18px", background: submitting || !designId || !blankId ? "#999" : "#111", color: "#fff", border: "none", borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: submitting || !designId || !blankId ? "not-allowed" : "pointer" }}>
            {submitting ? "Publishing…" : "Publish product"}
          </button>
          <button type="button" onClick={() => { localStorage.removeItem("krossover_admin_token"); setTokenState(""); }} style={{ padding: "10px 18px", background: "#fff", color: "#111", border: "1px solid #d4d4cf", borderRadius: 5, fontSize: 14, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
}
