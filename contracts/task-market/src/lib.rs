//! Task Market Contract
//!
//! A permissionless marketplace where requesters post tasks and agents claim
//! them. Payment is escrowed in the contract on post; released to the agent
//! on completion, or refunded on cancellation.
//!
//! State machine: Open → Claimed → Completed | Cancelled
//!
//! # TODO for contributors
//! - [ ] Integrate with Reputation contract to auto-rate on completion
//! - [ ] Add dispute resolution window before payment release
//! - [ ] Support partial payments for multi-step tasks
//! - [ ] Add deadline enforcement via ledger sequence

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum TaskStatus {
    Open,
    Claimed,
    Completed,
    Cancelled,
}

#[contracttype]
pub enum DataKey {
    Task(u64),
    TaskCount,
}

#[contracttype]
#[derive(Clone)]
pub struct Task {
    pub id: u64,
    pub requester: Address,
    /// IPFS CID or URI describing the task.
    pub description_uri: String,
    /// Token used for payment (e.g. USDC SAC address).
    pub payment_token: Address,
    /// Amount escrowed (in token's smallest unit).
    pub payment_amount: i128,
    pub status: TaskStatus,
    /// Set when an agent claims the task.
    pub assignee: Option<Address>,
}

#[contract]
pub struct TaskMarket;

#[contractimpl]
impl TaskMarket {
    /// Post a new task. Transfers `payment_amount` from requester into escrow.
    pub fn post(
        env: Env,
        requester: Address,
        description_uri: String,
        payment_token: Address,
        payment_amount: i128,
    ) -> u64 {
        requester.require_auth();
        assert!(payment_amount > 0, "payment must be positive");

        // Escrow payment
        let token_client = token::Client::new(&env, &payment_token);
        token_client.transfer(
            &requester,
            &env.current_contract_address(),
            &payment_amount,
        );

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TaskCount)
            .unwrap_or(0);
        let task_id = count + 1;

        let task = Task {
            id: task_id,
            requester,
            description_uri,
            payment_token,
            payment_amount,
            status: TaskStatus::Open,
            assignee: None,
        };

        env.storage().persistent().set(&DataKey::Task(task_id), &task);
        env.storage().instance().set(&DataKey::TaskCount, &task_id);

        env.events()
            .publish((Symbol::new(&env, "task_posted"),), (task_id, payment_amount));

        task_id
    }

    /// Claim an open task. Only one agent may claim at a time.
    pub fn claim(env: Env, agent: Address, task_id: u64) {
        agent.require_auth();

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .expect("task not found");

        assert!(task.status == TaskStatus::Open, "task not open");

        task.status = TaskStatus::Claimed;
        task.assignee = Some(agent.clone());
        env.storage().persistent().set(&DataKey::Task(task_id), &task);

        env.events()
            .publish((Symbol::new(&env, "task_claimed"),), (task_id, agent));
    }

    /// Mark a task complete and release escrowed payment to the assignee.
    /// Only the requester can confirm completion.
    pub fn complete(env: Env, requester: Address, task_id: u64) {
        requester.require_auth();

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .expect("task not found");

        assert!(task.requester == requester, "not the requester");
        assert!(task.status == TaskStatus::Claimed, "task not claimed");

        let assignee = task.assignee.clone().expect("no assignee");

        // Release escrow
        let token_client = token::Client::new(&env, &task.payment_token);
        token_client.transfer(
            &env.current_contract_address(),
            &assignee,
            &task.payment_amount,
        );

        task.status = TaskStatus::Completed;
        env.storage().persistent().set(&DataKey::Task(task_id), &task);

        env.events()
            .publish((Symbol::new(&env, "task_completed"),), (task_id, assignee));
    }

    /// Cancel an open task and refund the requester.
    pub fn cancel(env: Env, requester: Address, task_id: u64) {
        requester.require_auth();

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .expect("task not found");

        assert!(task.requester == requester, "not the requester");
        assert!(task.status == TaskStatus::Open, "can only cancel open tasks");

        let token_client = token::Client::new(&env, &task.payment_token);
        token_client.transfer(
            &env.current_contract_address(),
            &requester,
            &task.payment_amount,
        );

        task.status = TaskStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Task(task_id), &task);
    }

    pub fn get_task(env: Env, task_id: u64) -> Option<Task> {
        env.storage().persistent().get(&DataKey::Task(task_id))
    }

    pub fn task_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::TaskCount).unwrap_or(0)
    }
}
