"use client";

/**
 * useFreighter
 *
 * Connects to the Freighter browser extension wallet.
 * Returns the connected public key and a connect function.
 *
 * TODO for contributors:
 * - Add network mismatch detection (warn if not on testnet)
 * - Persist connection state across page reloads
 */

import { useState, useCallback } from "react";
import {
  isConnected,
  getPublicKey,
  requestAccess,
} from "@stellar/freighter-api";

export function useFreighter() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    const connected = await isConnected();
    if (!connected) {
      setError("Freighter extension not found. Install it at freighter.app");
      return;
    }
    await requestAccess();
    const key = await getPublicKey();
    setPublicKey(key);
  }, []);

  const disconnect = useCallback(() => setPublicKey(null), []);

  return { publicKey, connect, disconnect, error };
}
