import { AgentWallet } from "../src/wallet";
import { AgentConfig } from "../src/types";

// Testnet keypair — never use in production
const TEST_SECRET = "SCZANGBA5RLMPI7JMTP2UX7BAYR7QDTBM7BFXNBZQKZQKZQKZQKZQK";

const config: AgentConfig = {
  secretKey: TEST_SECRET,
  network: "testnet",
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  registryContractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
  reputationContractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
  taskMarketContractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
};

describe("AgentWallet", () => {
  it("derives public key from secret", () => {
    const wallet = new AgentWallet(config);
    expect(wallet.publicKey()).toMatch(/^G[A-Z2-7]{55}$/);
  });

  it("returns a signer keypair", () => {
    const wallet = new AgentWallet(config);
    expect(wallet.signer()).toBeDefined();
  });

  it("returns testnet network passphrase", () => {
    const wallet = new AgentWallet(config);
    expect(wallet.network()).toContain("Test SDF");
  });
});
