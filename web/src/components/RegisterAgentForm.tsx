"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { signAndSubmit } from "@/lib/stellar";
import { useFreighter } from "@/hooks/useFreighter";

const CAPABILITIES = [
  { label: "Text Inference", bit: 1 },
  { label: "Image Generation", bit: 2 },
  { label: "Data Analysis", bit: 4 },
  { label: "Code Execution", bit: 8 },
  { label: "Web Search", bit: 16 },
];

export function RegisterAgentForm() {
  const { publicKey, connect } = useFreighter();
  const [metadataUri, setMetadataUri] = useState("");
  const [caps, setCaps] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleCap(bit: number) {
    setCaps((prev) => prev ^ bit);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey) { await connect(); return; }
    setLoading(true);
    setStatus(null);
    try {
      const { xdr } = await api.post<{ xdr: string }>("/agents", {
        callerAddress: publicKey,
        metadataUri,
        capabilities: caps,
      });
      const hash = await signAndSubmit(xdr);
      setStatus(`✓ Agent registered. Tx: ${hash.slice(0, 12)}…`);
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 480 }}>
      <h3>Register Agent</h3>
      <input value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)}
        placeholder="Metadata URI (ipfs:// or https://)" required style={inputStyle} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {CAPABILITIES.map(({ label, bit }) => (
          <label key={bit} style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}>
            <input type="checkbox" checked={!!(caps & bit)} onChange={() => toggleCap(bit)} />
            {label}
          </label>
        ))}
      </div>
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? "Submitting…" : publicKey ? "Register" : "Connect Wallet"}
      </button>
      {status && <p style={{ fontSize: "0.85rem", color: status.startsWith("✓") ? "#4ade80" : "#f87171" }}>{status}</p>}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#1e1e2e", border: "1px solid #333", color: "#e8e8f0",
  padding: "0.5rem 0.9rem", borderRadius: 6, fontSize: "0.9rem",
};
const btnStyle: React.CSSProperties = {
  background: "#3b5bdb", border: "none", color: "#fff",
  padding: "0.5rem 1.2rem", borderRadius: 6, cursor: "pointer",
};
