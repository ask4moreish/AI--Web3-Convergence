//! Agent Registry Contract
//!
//! On-chain registry for autonomous AI agents. Each agent registers with a
//! Stellar address (its identity keypair), a metadata URI, and a capability
//! bitmask. The registry is the discovery layer — other agents and clients
//! query it to find agents by capability.
//!
//! # Storage layout
//! - `AgentEntry` keyed by `Address` — persistent, one entry per agent.
//! - `AgentCount` — running total, used for pagination off-chain.
//!
//! # TODO for contributors
//! - [ ] Add capability-based filtering (requires an index map)
//! - [ ] Emit `AgentUpdated` event on metadata change
//! - [ ] Add admin-controlled deactivation for malicious agents

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec};

// ── Storage keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Agent(Address),
    AgentCount,
}

// ── Data types ───────────────────────────────────────────────────────────────

/// Bitmask of capabilities an agent advertises.
/// Bit 0 = text inference, Bit 1 = image generation, Bit 2 = data analysis …
pub type CapabilityMask = u64;

#[contracttype]
#[derive(Clone)]
pub struct AgentEntry {
    /// Stellar address that controls this agent (its signing keypair).
    pub owner: Address,
    /// IPFS CID or HTTPS URI pointing to the agent's metadata JSON.
    pub metadata_uri: String,
    /// Advertised capabilities as a bitmask.
    pub capabilities: CapabilityMask,
    /// Ledger sequence at registration time.
    pub registered_at: u32,
    /// Whether the agent is accepting new tasks.
    pub active: bool,
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct AgentRegistry;

#[contractimpl]
impl AgentRegistry {
    /// Register a new agent. The caller becomes the owner.
    /// Panics if the address is already registered.
    pub fn register(
        env: Env,
        owner: Address,
        metadata_uri: String,
        capabilities: CapabilityMask,
    ) {
        owner.require_auth();

        let key = DataKey::Agent(owner.clone());
        if env.storage().persistent().has(&key) {
            panic!("agent already registered");
        }

        let entry = AgentEntry {
            owner: owner.clone(),
            metadata_uri,
            capabilities,
            registered_at: env.ledger().sequence(),
            active: true,
        };

        env.storage().persistent().set(&key, &entry);

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::AgentCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::AgentCount, &(count + 1));

        env.events().publish(
            (Symbol::new(&env, "agent_registered"),),
            (owner, capabilities),
        );
    }

    /// Update metadata URI and/or capabilities. Only the owner may call this.
    pub fn update(
        env: Env,
        owner: Address,
        metadata_uri: String,
        capabilities: CapabilityMask,
    ) {
        owner.require_auth();

        let key = DataKey::Agent(owner.clone());
        let mut entry: AgentEntry = env
            .storage()
            .persistent()
            .get(&key)
            .expect("agent not found");

        entry.metadata_uri = metadata_uri;
        entry.capabilities = capabilities;
        env.storage().persistent().set(&key, &entry);
    }

    /// Toggle the agent's active status.
    pub fn set_active(env: Env, owner: Address, active: bool) {
        owner.require_auth();

        let key = DataKey::Agent(owner.clone());
        let mut entry: AgentEntry = env
            .storage()
            .persistent()
            .get(&key)
            .expect("agent not found");

        entry.active = active;
        env.storage().persistent().set(&key, &entry);
    }

    /// Fetch a single agent entry.
    pub fn get(env: Env, owner: Address) -> Option<AgentEntry> {
        env.storage()
            .persistent()
            .get(&DataKey::Agent(owner))
    }

    /// Total number of registered agents.
    pub fn count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::AgentCount)
            .unwrap_or(0)
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    fn setup() -> (Env, AgentRegistryClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AgentRegistry);
        let client = AgentRegistryClient::new(&env, &contract_id);
        (env, client)
    }

    #[test]
    fn register_and_get() {
        let (env, client) = setup();
        let owner = Address::generate(&env);
        let uri = String::from_str(&env, "ipfs://Qm...");

        client.register(&owner, &uri, &0b0001);

        let entry = client.get(&owner).unwrap();
        assert_eq!(entry.capabilities, 0b0001);
        assert!(entry.active);
        assert_eq!(client.count(), 1);
    }

    #[test]
    #[should_panic(expected = "agent already registered")]
    fn double_register_panics() {
        let (env, client) = setup();
        let owner = Address::generate(&env);
        let uri = String::from_str(&env, "ipfs://Qm...");
        client.register(&owner, &uri, &0b0001);
        client.register(&owner, &uri, &0b0001);
    }
}
