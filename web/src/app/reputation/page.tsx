"use client";

/**
 * Reputation Lookup
 *
 * Look up an agent's on-chain EMA score.
 *
 * TODO for contributors:
 * - Add leaderboard (top-rated agents)
 * - Add rating submission form (requires Freighter signing)
 */

import { useState } from "react";
import { api } from "@/lib/api";

interface ScoreResponse {
  address: string;
  ema: number | null;
  count: number | null;
}

export default function ReputationPage() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ScoreResponse>(`/reputation/${address.trim()}`);
      setResult(data);
    } catch (e) {
      setError("Lookup failed — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  const score = result?.ema != null ? (result.ema / 1000).toFixed(2) : null;

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Reputation Lookup</h2>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Agent address (G...)"
          style={inputStyle}
        />
        <button onClick={lookup} disabled={loading} style={btnStyle}>
          {loading ? "…" : "Look up"}
        </button>
      </div>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      {result && (
        <div style={{ background: "#1e1e2e", borderRadius: 10, padding: "1.5rem" }}>
          <p style={{ fontFamily: "monospace", marginBottom: "0.75rem", color: "#888" }}>
            {result.address}
          </p>
          {score ? (
            <>
              <p style={{ fontSize: "3rem", fontWeight: 700 }}>{score} / 5.0</p>
              <p style={{ color: "#888", marginTop: "0.5rem" }}>
                Based on {result.count} rating{result.count !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p style={{ color: "#888" }}>No ratings yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: "#1e1e2e", border: "1px solid #333", color: "#e8e8f0",
  padding: "0.5rem 0.9rem", borderRadius: 6, fontSize: "0.9rem",
};
const btnStyle: React.CSSProperties = {
  background: "#3b5bdb", border: "none", color: "#fff",
  padding: "0.5rem 1.2rem", borderRadius: 6, cursor: "pointer",
};
