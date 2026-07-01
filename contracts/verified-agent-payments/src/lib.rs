//! Verified Agent Payments — Payment-backed proof registry for AI-agent work on Casper.
//! Core positioning: No Proof without a Payment.
//!
//! Entry points:
//! - init: Initializes the contract, setting the deployer as owner.
//! - register_agent: Registers a verified agent with name, verifier function, and WASM code hash.
//! - create_payment: Creates a payment-backed task intent.
//! - anchor_proof: Anchors attestation proof hashes on-chain.
//! - mark_payable: Marks a task as payable after proof anchoring.
//! - mark_paid: Marks a task as paid.
//! - get_agent: Returns agent record by id.
//! - get_payment: Returns task/payment record by id.
#![no_std]
extern crate alloc;
use odra::casper_types::U512;
use odra::prelude::*;

// ============================================================================
// Errors
// ============================================================================

/// Contract error enum. Discriminants must be unique across the project.
#[odra::odra_error]
pub enum Error {
    NotOwner = 1,
    AgentAlreadyExists = 2,
    AgentNotFound = 3,
    AgentInactive = 4,
    PaymentAlreadyExists = 5,
    PaymentNotFound = 6,
    ProofAlreadyAnchored = 7,
    PaymentNotVerified = 8,
    PaymentNotPayable = 9,
    InvalidState = 10,
}

// ============================================================================
// Types
// ============================================================================

/// Record stored for each registered agent.
#[odra::odra_type]
pub struct AgentRecord {
    pub owner: Address,
    pub name: String,
    pub verifier_function: String,
    pub wasm_code_hash: String,
    pub active: bool,
}

/// Record stored for each payment-backed task.
#[odra::odra_type]
pub struct PaymentRecord {
    pub agent_id: String,
    pub task_id: String,
    pub payment_amount: U512,
    pub payment_state: String,
    pub input_hash: String,
    pub output_hash: String,
    pub attestation_hash: String,
    pub verified: bool,
}

// ============================================================================
// Events
// ============================================================================

/// Emitted when a new agent is registered.
#[odra::event]
pub struct AgentRegistered {
    pub agent_id: String,
    pub owner: Address,
    pub name: String,
    pub verifier_function: String,
    pub wasm_code_hash: String,
}

/// Emitted when a payment-backed task is created.
#[odra::event]
pub struct PaymentCreated {
    pub task_id: String,
    pub agent_id: String,
    pub payment_amount: U512,
}

/// Emitted when proof hashes are anchored on-chain.
#[odra::event]
pub struct ProofAnchored {
    pub task_id: String,
    pub input_hash: String,
    pub output_hash: String,
    pub attestation_hash: String,
}

/// Emitted when a task is marked as payable after proof anchoring.
#[odra::event]
pub struct PaymentMarkedPayable {
    pub task_id: String,
}

/// Emitted when a task is marked as paid.
#[odra::event]
pub struct PaymentMarkedPaid {
    pub task_id: String,
}

// ============================================================================
// Contract module
// ============================================================================

/// Verified Agent Payments contract.
///
/// Stores agents and payment-backed tasks on-chain with proof anchoring.
#[odra::module(
    errors = Error,
    events = [
        AgentRegistered,
        PaymentCreated,
        ProofAnchored,
        PaymentMarkedPayable,
        PaymentMarkedPaid,
    ]
)]
pub struct VerifiedAgentPayments {
    /// Owner of the contract — set once during init.
    owner: Var<Address>,
    /// Mapping from agent_id to AgentRecord.
    agents: Mapping<String, AgentRecord>,
    /// Sentinel mapping: tracks whether an agent_id is registered.
    agent_registered: Mapping<String, bool>,
    /// Mapping from task_id to PaymentRecord.
    payments: Mapping<String, PaymentRecord>,
    /// Sentinel mapping: tracks whether a task_id is registered.
    payment_registered: Mapping<String, bool>,
}

#[odra::module]
impl VerifiedAgentPayments {
    // -----------------------------------------------------------------------
    // init
    // -----------------------------------------------------------------------

    /// Initializes the contract, setting the caller as the contract owner.
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller);
    }

    // -----------------------------------------------------------------------
    // register_agent
    // -----------------------------------------------------------------------

    /// Registers a new agent. Only the contract owner may call this.
    ///
    /// # Arguments
    /// - `agent_id` — unique identifier for the agent.
    /// - `name` — human-readable agent name.
    /// - `verifier_function` — name of the verification function (e.g., "verifyInvoiceRisk").
    /// - `wasm_code_hash` — hash of the WASM code used for verification.
    pub fn register_agent(
        &mut self,
        agent_id: String,
        name: String,
        verifier_function: String,
        wasm_code_hash: String,
    ) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_revert_with(Error::NotOwner) {
            self.env().revert(Error::NotOwner);
        }

        // Sentinel check: agent must not already be registered.
        if self.agent_registered.get(&agent_id).unwrap_or(false) {
            self.env().revert(Error::AgentAlreadyExists);
        }

        let record = AgentRecord {
            owner: caller,
            name: name.clone(),
            verifier_function: verifier_function.clone(),
            wasm_code_hash: wasm_code_hash.clone(),
            active: true,
        };

        self.agents.set(&agent_id, record);
        self.agent_registered.set(&agent_id, true);

        self.env().emit_event(AgentRegistered {
            agent_id,
            owner: caller,
            name,
            verifier_function,
            wasm_code_hash,
        });
    }

    // -----------------------------------------------------------------------
    // create_payment
    // -----------------------------------------------------------------------

    /// Creates a payment-backed task intent. The caller becomes the task buyer.
    ///
    /// # Arguments
    /// - `task_id` — unique task identifier.
    /// - `agent_id` — the agent assigned to this task.
    /// - `payment_amount` — locked payment amount in motes (U512).
    pub fn create_payment(
        &mut self,
        task_id: String,
        agent_id: String,
        payment_amount: U512,
    ) {
        // Sentinel check: payment must not already exist.
        if self.payment_registered.get(&task_id).unwrap_or(false) {
            self.env().revert(Error::PaymentAlreadyExists);
        }

        // Verify agent exists and is active.
        let agent = self
            .agents
            .get(&agent_id)
            .unwrap_or_revert_with(&*self.env(), Error::AgentNotFound);

        if !agent.active {
            self.env().revert(Error::AgentInactive);
        }

        let record = PaymentRecord {
            agent_id: agent_id.clone(),
            task_id: task_id.clone(),
            payment_amount,
            payment_state: String::from("requested"),
            input_hash: String::new(),
            output_hash: String::new(),
            attestation_hash: String::new(),
            verified: false,
        };

        self.payments.set(&task_id, record);
        self.payment_registered.set(&task_id, true);

        self.env().emit_event(PaymentCreated {
            task_id,
            agent_id,
            payment_amount,
        });
    }

    // -----------------------------------------------------------------------
    // anchor_proof
    // -----------------------------------------------------------------------

    /// Anchors attestation proof hashes on-chain for a task.
    /// Only the contract owner may call this.
    ///
    /// # Arguments
    /// - `task_id` — the task to anchor proof for.
    /// - `input_hash` — SHA-256 hash of the task input.
    /// - `output_hash` — SHA-256 hash of the verified output.
    /// - `attestation_hash` — hash of the full attestation document.
    pub fn anchor_proof(
        &mut self,
        task_id: String,
        input_hash: String,
        output_hash: String,
        attestation_hash: String,
    ) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_revert_with(Error::NotOwner) {
            self.env().revert(Error::NotOwner);
        }

        // Fetch and mutate the payment record.
        let mut record = self
            .payments
            .get(&task_id)
            .unwrap_or_revert_with(&*self.env(), Error::PaymentNotFound);

        // Once anchored, proof cannot be overwritten.
        if record.verified {
            self.env().revert(Error::ProofAlreadyAnchored);
        }

        record.input_hash = input_hash.clone();
        record.output_hash = output_hash.clone();
        record.attestation_hash = attestation_hash.clone();
        record.verified = true;
        record.payment_state = String::from("proof_verified");

        self.payments.set(&task_id, record);

        self.env().emit_event(ProofAnchored {
            task_id,
            input_hash,
            output_hash,
            attestation_hash,
        });
    }

    // -----------------------------------------------------------------------
    // mark_payable
    // -----------------------------------------------------------------------

    /// Marks a task as payable. Requires the task to have a verified proof anchored.
    /// Only the contract owner may call this.
    pub fn mark_payable(&mut self, task_id: String) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_revert_with(Error::NotOwner) {
            self.env().revert(Error::NotOwner);
        }

        let mut record = self
            .payments
            .get(&task_id)
            .unwrap_or_revert_with(&*self.env(), Error::PaymentNotFound);

        if !record.verified {
            self.env().revert(Error::PaymentNotVerified);
        }

        if record.payment_state != "proof_verified" {
            self.env().revert(Error::InvalidState);
        }

        record.payment_state = String::from("payable");
        self.payments.set(&task_id, record);

        self.env().emit_event(PaymentMarkedPayable { task_id });
    }

    // -----------------------------------------------------------------------
    // mark_paid
    // -----------------------------------------------------------------------

    /// Marks a task as paid. The task must be in the "payable" state.
    /// Only the contract owner may call this.
    pub fn mark_paid(&mut self, task_id: String) {
        let caller = self.env().caller();
        if caller != self.owner.get_or_revert_with(Error::NotOwner) {
            self.env().revert(Error::NotOwner);
        }

        let mut record = self
            .payments
            .get(&task_id)
            .unwrap_or_revert_with(&*self.env(), Error::PaymentNotFound);

        if record.payment_state != "payable" {
            self.env().revert(Error::PaymentNotPayable);
        }

        record.payment_state = String::from("paid");
        self.payments.set(&task_id, record);

        self.env().emit_event(PaymentMarkedPaid { task_id });
    }

    // -----------------------------------------------------------------------
    // get_agent
    // -----------------------------------------------------------------------

    /// Returns the agent record for the given agent_id, if it exists.
    pub fn get_agent(&self, agent_id: String) -> Option<AgentRecord> {
        self.agents.get(&agent_id)
    }

    // -----------------------------------------------------------------------
    // get_payment
    // -----------------------------------------------------------------------

    /// Returns the payment record for the given task_id, if it exists.
    pub fn get_payment(&self, task_id: String) -> Option<PaymentRecord> {
        self.payments.get(&task_id)
    }
}
