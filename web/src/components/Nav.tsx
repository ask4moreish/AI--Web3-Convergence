"use client";

import Link from "next/link";
import { useFreighter } from "@/hooks/useFreighter";

export function Nav() {
  const { publicKey, connect, disconnect, error } = useFreighter();

  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: "1.5rem",
      padding: "1rem 2rem", borderBottom: "1px solid #1e1e2e",
    }}>
      <Link href="/" style={{ fontWeight: 700, color: "#e8e8f0" }}>
        ✦ Stellar Agents
      </Link>
      <Link href="/agents">Agents</Link>
      <Link href="/tasks">Tasks</Link>
      <Link href="/reputation">Reputation</Link>

      <span style={{ marginLeft: "auto" }}>
        {publicKey ? (
          <button onClick={disconnect} style={btnStyle}>
            {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
          </button>
        ) : (
          <button onClick={connect} style={btnStyle}>Connect Wallet</button>
        )}
        {error && <span style={{ color: "#f87171", marginLeft: "0.5rem", fontSize: "0.8rem" }}>{error}</span>}
      </span>
    </nav>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#1e1e2e", border: "1px solid #333", color: "#e8e8f0",
  padding: "0.4rem 0.9rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem",
};
