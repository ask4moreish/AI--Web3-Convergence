import { AgentWallet } from "../wallet";
import { AgentConfig } from "../types";

// Testnet keypair — never use in production
const TEST_SECRET = "SBCRRLIG5YWHC5GE67ZI7BQ4KR3KEXIOOM2RBHUUXWMW5XNQNYMRR2T4";

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
