"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { signAndSubmit } from "@/lib/stellar";
import { useFreighter } from "@/hooks/useFreighter";

export function PostTaskForm() {
  const { publicKey, connect } = useFreighter();
  const [descriptionUri, setDescriptionUri] = useState("");
  const [paymentToken, setPaymentToken] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey) { await connect(); return; }
    setLoading(true);
    setStatus(null);
    try {
      const { xdr } = await api.post<{ xdr: string }>("/tasks", {
        requester: publicKey,
        descriptionUri,
        paymentToken,
        paymentAmount: Number(paymentAmount),
      });
      const hash = await signAndSubmit(xdr);
      setStatus(`✓ Task posted. Tx: ${hash.slice(0, 12)}…`);
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 480 }}>
      <h3>Post a Task</h3>
      <input value={descriptionUri} onChange={(e) => setDescriptionUri(e.target.value)}
        placeholder="Description URI (ipfs:// or https://)" required style={inputStyle} />
      <input value={paymentToken} onChange={(e) => setPaymentToken(e.target.value)}
        placeholder="Payment token address (C...)" required style={inputStyle} />
      <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
        placeholder="Amount (in token's smallest unit)" type="number" required style={inputStyle} />
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? "Submitting…" : publicKey ? "Post Task" : "Connect Wallet"}
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
