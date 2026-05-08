//! Reputation Contract
//!
//! Tracks on-chain quality scores for agents. After a task completes, the
//! requester submits a rating (1–5). The contract maintains a running weighted
//! average using an exponential moving average (EMA) with α = 0.1 so recent
//! ratings carry more weight without requiring unbounded storage.
//!
//! Score is stored as a fixed-point integer: `score * 1000` (i.e. 4500 = 4.5).
//!
//! # TODO for contributors
//! - [ ] Tie rating submission to a verified task completion event
//! - [ ] Add stake-weighted ratings (higher-stake raters have more influence)
//! - [ ] Implement score decay for inactive agents

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

const SCALE: i128 = 1_000;
const ALPHA_NUM: i128 = 1; // α = 0.1 expressed as ALPHA_NUM / ALPHA_DEN
const ALPHA_DEN: i128 = 10;

#[contracttype]
pub enum DataKey {
    Score(Address),
    RatingCount(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct ScoreEntry {
    /// EMA score × 1000. Starts at 3000 (neutral 3.0 / 5.0).
    pub ema: i128,
    /// Total number of ratings received.
    pub count: u32,
}

#[contract]
pub struct Reputation;

#[contractimpl]
impl Reputation {
    /// Submit a rating for `agent` from `rater`. Rating must be 1–5.
    /// In production this should verify the rater completed a task with the agent.
    pub fn rate(env: Env, rater: Address, agent: Address, rating: u32) {
        rater.require_auth();
        assert!(rating >= 1 && rating <= 5, "rating must be 1-5");

        let key = DataKey::Score(agent.clone());
        let mut entry: ScoreEntry = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(ScoreEntry { ema: 3 * SCALE, count: 0 });

        // EMA update: new_ema = α * rating + (1 - α) * old_ema
        let new_rating = (rating as i128) * SCALE;
        entry.ema = (ALPHA_NUM * new_rating + (ALPHA_DEN - ALPHA_NUM) * entry.ema) / ALPHA_DEN;
        entry.count += 1;

        env.storage().persistent().set(&key, &entry);

        env.events().publish(
            (Symbol::new(&env, "rated"),),
            (rater, agent, rating, entry.ema),
        );
    }

    /// Returns the current score entry for an agent, or None if unrated.
    pub fn score(env: Env, agent: Address) -> Option<ScoreEntry> {
        env.storage().persistent().get(&DataKey::Score(agent))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn ema_converges_upward() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, Reputation);
        let client = ReputationClient::new(&env, &id);

        let rater = Address::generate(&env);
        let agent = Address::generate(&env);

        // Submit ten 5-star ratings; EMA should rise above 3.0
        for _ in 0..10 {
            client.rate(&rater, &agent, &5);
        }
        let entry = client.score(&agent).unwrap();
        assert!(entry.ema > 3 * 1_000);
    }
}
