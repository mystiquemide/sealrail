//! Tests for the VerifiedAgentPayments proof registry contract.
//!
//! Covers: init, register_agent, create_payment, anchor_proof,
//! mark_payable, mark_paid, get_agent, get_payment,
//! and error paths (duplicate register, agent not found,
//! proof already anchored, payment not verified, etc.)

use odra::casper_types::U512;
use odra::host::{Deployer, HostRef, NoArgs};
use odra::prelude::*;
use verified_agent_payments::*;

/// Deploys a fresh contract and returns its host reference.
fn setup() -> VerifiedAgentPaymentsHostRef {
    let env = odra_test::env();
    VerifiedAgentPayments::deploy(&env, NoArgs)
}

// ============================================================================
// 1. init tests
// ============================================================================

#[test]
fn test_init_sets_owner() {
    let mut contract = setup();
    let env = contract.env().clone();
    let owner = env.get_account(0);
    contract.register_agent(
        String::from("agent-1"),
        String::from("Test Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("abc123hash"),
    );
    let agent = contract.get_agent(String::from("agent-1"));
    assert!(agent.is_some());
    let agent = agent.unwrap();
    assert_eq!(agent.owner, owner);
    assert!(agent.active);
}

#[test]
fn test_init_emits_no_events_directly() {
    let mut contract = setup();
    let agent_id = String::from("agent-init-test");
    contract.register_agent(
        agent_id.clone(),
        String::from("Init Test"),
        String::from("verifyInvoiceRisk"),
        String::from("hash123"),
    );
    assert!(contract.get_agent(agent_id).is_some());
}

// ============================================================================
// 2. register_agent tests
// ============================================================================

#[test]
fn test_register_agent_success() {
    let mut contract = setup();
    let owner = contract.env().get_account(0);

    contract.register_agent(
        String::from("agent-1"),
        String::from("RiskBot"),
        String::from("verifyInvoiceRisk"),
        String::from("wasm_hash_abc123"),
    );

    let agent = contract.get_agent(String::from("agent-1")).unwrap();
    assert_eq!(agent.owner, owner);
    assert_eq!(agent.name, "RiskBot");
    assert_eq!(agent.verifier_function, "verifyInvoiceRisk");
    assert_eq!(agent.wasm_code_hash, "wasm_hash_abc123");
    assert!(agent.active);

    let env = contract.env();
    assert!(env.emitted_event(
        &contract,
        AgentRegistered {
            agent_id: String::from("agent-1"),
            owner,
            name: String::from("RiskBot"),
            verifier_function: String::from("verifyInvoiceRisk"),
            wasm_code_hash: String::from("wasm_hash_abc123"),
        }
    ));
}

#[test]
fn test_register_agent_duplicate_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-dup"),
        String::from("First"),
        String::from("verifyInvoiceRisk"),
        String::from("hash1"),
    );

    let result = contract.try_register_agent(
        String::from("agent-dup"),
        String::from("Second"),
        String::from("verifyInvoiceRisk"),
        String::from("hash2"),
    );

    assert_eq!(result.unwrap_err(), Error::AgentAlreadyExists.into());
}

#[test]
fn test_register_agent_not_owner_fails() {
    let mut contract = setup();
    let env = contract.env().clone();
    let not_owner = env.get_account(1);
    env.set_caller(not_owner);

    let result = contract.try_register_agent(
        String::from("agent-fail"),
        String::from("Hacker"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    assert_eq!(result.unwrap_err(), Error::NotOwner.into());
}

#[test]
fn test_register_multiple_agents() {
    let mut contract = setup();

    for i in 0..5 {
        let id = format!("agent-multi-{}", i);
        contract.register_agent(
            id.clone(),
            format!("Agent {}", i),
            String::from("verifyInvoiceRisk"),
            format!("hash_{}", i),
        );
    }

    for i in 0..5 {
        let id = format!("agent-multi-{}", i);
        let agent = contract.get_agent(id).unwrap();
        assert!(agent.active);
    }
}

// ============================================================================
// 3. create_payment tests
// ============================================================================

#[test]
fn test_create_payment_success() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-pay"),
        String::from("Pay Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash_pay"),
    );

    contract.create_payment(
        String::from("task-1"),
        String::from("agent-pay"),
        U512::from(1000u64),
    );

    let payment = contract.get_payment(String::from("task-1")).unwrap();
    assert_eq!(payment.agent_id, "agent-pay");
    assert_eq!(payment.task_id, "task-1");
    assert_eq!(payment.payment_amount, U512::from(1000u64));
    assert_eq!(payment.payment_state, "requested");
    assert!(!payment.verified);
    assert!(payment.input_hash.is_empty());

    let env = contract.env();
    assert!(env.emitted_event(
        &contract,
        PaymentCreated {
            task_id: String::from("task-1"),
            agent_id: String::from("agent-pay"),
            payment_amount: U512::from(1000u64),
        }
    ));
}

#[test]
fn test_create_payment_duplicate_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-dup-pay"),
        String::from("Dup"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-dup"),
        String::from("agent-dup-pay"),
        U512::from(500u64),
    );

    let result = contract.try_create_payment(
        String::from("task-dup"),
        String::from("agent-dup-pay"),
        U512::from(500u64),
    );

    assert_eq!(result.unwrap_err(), Error::PaymentAlreadyExists.into());
}

#[test]
fn test_create_payment_agent_not_found_fails() {
    let mut contract = setup();

    let result = contract.try_create_payment(
        String::from("task-nope"),
        String::from("nonexistent-agent"),
        U512::from(100u64),
    );

    assert_eq!(result.unwrap_err(), Error::AgentNotFound.into());
}

#[test]
fn test_create_payment_inactive_agent_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("active-agent"),
        String::from("Active"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    // Should succeed because agent is active by default.
    contract.create_payment(
        String::from("task-ok"),
        String::from("active-agent"),
        U512::from(50u64),
    );
    assert!(contract.get_payment(String::from("task-ok")).is_some());
}

// ============================================================================
// 4. anchor_proof tests
// ============================================================================

#[test]
fn test_anchor_proof_success() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-anchor"),
        String::from("Anchor Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash_anchor"),
    );

    contract.create_payment(
        String::from("task-anchor"),
        String::from("agent-anchor"),
        U512::from(2000u64),
    );

    contract.anchor_proof(
        String::from("task-anchor"),
        String::from("input_hash_sha256"),
        String::from("output_hash_sha256"),
        String::from("attestation_hash_sha256"),
    );

    let payment = contract.get_payment(String::from("task-anchor")).unwrap();
    assert!(payment.verified);
    assert_eq!(payment.input_hash, "input_hash_sha256");
    assert_eq!(payment.output_hash, "output_hash_sha256");
    assert_eq!(payment.attestation_hash, "attestation_hash_sha256");
    assert_eq!(payment.payment_state, "proof_verified");

    let env = contract.env();
    assert!(env.emitted_event(
        &contract,
        ProofAnchored {
            task_id: String::from("task-anchor"),
            input_hash: String::from("input_hash_sha256"),
            output_hash: String::from("output_hash_sha256"),
            attestation_hash: String::from("attestation_hash_sha256"),
        }
    ));
}

#[test]
fn test_anchor_proof_task_not_found_fails() {
    let mut contract = setup();

    let result = contract.try_anchor_proof(
        String::from("nonexistent-task"),
        String::from("ih"),
        String::from("oh"),
        String::from("ah"),
    );

    assert_eq!(result.unwrap_err(), Error::PaymentNotFound.into());
}

#[test]
fn test_anchor_proof_not_owner_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-anchor-own"),
        String::from("Own Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-own"),
        String::from("agent-anchor-own"),
        U512::from(100u64),
    );

    let env = contract.env().clone();
    let not_owner = env.get_account(1);
    env.set_caller(not_owner);

    let result = contract.try_anchor_proof(
        String::from("task-own"),
        String::from("ih"),
        String::from("oh"),
        String::from("ah"),
    );

    assert_eq!(result.unwrap_err(), Error::NotOwner.into());
}

#[test]
fn test_anchor_proof_already_anchored_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-double"),
        String::from("Double"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-double"),
        String::from("agent-double"),
        U512::from(50u64),
    );

    contract.anchor_proof(
        String::from("task-double"),
        String::from("ih1"),
        String::from("oh1"),
        String::from("ah1"),
    );

    let result = contract.try_anchor_proof(
        String::from("task-double"),
        String::from("ih2"),
        String::from("oh2"),
        String::from("ah2"),
    );

    assert_eq!(result.unwrap_err(), Error::ProofAlreadyAnchored.into());
}

// ============================================================================
// 5. mark_payable tests
// ============================================================================

#[test]
fn test_mark_payable_success() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-payable"),
        String::from("Payable Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-payable"),
        String::from("agent-payable"),
        U512::from(100u64),
    );

    contract.anchor_proof(
        String::from("task-payable"),
        String::from("ih"),
        String::from("oh"),
        String::from("ah"),
    );

    contract.mark_payable(String::from("task-payable"));

    let payment = contract.get_payment(String::from("task-payable")).unwrap();
    assert_eq!(payment.payment_state, "payable");

    let env = contract.env();
    assert!(env.emitted_event(
        &contract,
        PaymentMarkedPayable {
            task_id: String::from("task-payable"),
        }
    ));
}

#[test]
fn test_mark_payable_not_verified_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-nv"),
        String::from("NV Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-nv"),
        String::from("agent-nv"),
        U512::from(50u64),
    );

    let result = contract.try_mark_payable(String::from("task-nv"));

    assert_eq!(result.unwrap_err(), Error::PaymentNotVerified.into());
}

#[test]
fn test_mark_payable_not_owner_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-po"),
        String::from("PO Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-po"),
        String::from("agent-po"),
        U512::from(50u64),
    );

    contract.anchor_proof(
        String::from("task-po"),
        String::from("ih"),
        String::from("oh"),
        String::from("ah"),
    );

    let env = contract.env().clone();
    env.set_caller(env.get_account(1));

    let result = contract.try_mark_payable(String::from("task-po"));

    assert_eq!(result.unwrap_err(), Error::NotOwner.into());
}

// ============================================================================
// 6. mark_paid tests
// ============================================================================

#[test]
fn test_mark_paid_success() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-paid"),
        String::from("Paid Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-paid"),
        String::from("agent-paid"),
        U512::from(100u64),
    );

    contract.anchor_proof(
        String::from("task-paid"),
        String::from("ih"),
        String::from("oh"),
        String::from("ah"),
    );

    contract.mark_payable(String::from("task-paid"));
    contract.mark_paid(String::from("task-paid"));

    let payment = contract.get_payment(String::from("task-paid")).unwrap();
    assert_eq!(payment.payment_state, "paid");

    let env = contract.env();
    assert!(env.emitted_event(
        &contract,
        PaymentMarkedPaid {
            task_id: String::from("task-paid"),
        }
    ));
}

#[test]
fn test_mark_paid_not_payable_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-np"),
        String::from("NP Agent"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-np"),
        String::from("agent-np"),
        U512::from(50u64),
    );

    // Payment is in "requested" state, not "payable".
    let result = contract.try_mark_paid(String::from("task-np"));

    assert_eq!(result.unwrap_err(), Error::PaymentNotPayable.into());
}

#[test]
fn test_mark_paid_not_owner_fails() {
    let mut contract = setup();

    contract.register_agent(
        String::from("agent-poa"),
        String::from("POA"),
        String::from("verifyInvoiceRisk"),
        String::from("hash"),
    );

    contract.create_payment(
        String::from("task-poa"),
        String::from("agent-poa"),
        U512::from(50u64),
    );

    contract.anchor_proof(
        String::from("task-poa"),
        String::from("ih"),
        String::from("oh"),
        String::from("ah"),
    );

    contract.mark_payable(String::from("task-poa"));

    let env = contract.env().clone();
    env.set_caller(env.get_account(1));

    let result = contract.try_mark_paid(String::from("task-poa"));

    assert_eq!(result.unwrap_err(), Error::NotOwner.into());
}

// ============================================================================
// 7. get_agent / get_payment tests
// ============================================================================

#[test]
fn test_get_agent_not_found_returns_none() {
    let contract = setup();

    let result = contract.get_agent(String::from("nonexistent"));
    assert!(result.is_none());
}

#[test]
fn test_get_payment_not_found_returns_none() {
    let contract = setup();

    let result = contract.get_payment(String::from("nonexistent"));
    assert!(result.is_none());
}

// ============================================================================
// 8. Full lifecycle end-to-end test
// ============================================================================

#[test]
fn test_full_payment_lifecycle() {
    let mut contract = setup();

    // 1. Register agent
    contract.register_agent(
        String::from("lifecycle-agent"),
        String::from("Full Cycle"),
        String::from("verifyInvoiceRisk"),
        String::from("hash_lifecycle"),
    );

    let owner = contract.env().get_account(0);
    let agent = contract.get_agent(String::from("lifecycle-agent")).unwrap();
    assert_eq!(agent.owner, owner);
    assert!(agent.active);

    // 2. Create payment
    contract.create_payment(
        String::from("lifecycle-task"),
        String::from("lifecycle-agent"),
        U512::from(10_000u64),
    );

    let payment = contract.get_payment(String::from("lifecycle-task")).unwrap();
    assert_eq!(payment.payment_state, "requested");
    assert!(!payment.verified);

    // 3. Anchor proof
    contract.anchor_proof(
        String::from("lifecycle-task"),
        String::from("input_hash"),
        String::from("output_hash"),
        String::from("attestation_hash"),
    );

    let payment = contract.get_payment(String::from("lifecycle-task")).unwrap();
    assert!(payment.verified);
    assert_eq!(payment.payment_state, "proof_verified");

    // 4. Mark payable
    contract.mark_payable(String::from("lifecycle-task"));

    let payment = contract.get_payment(String::from("lifecycle-task")).unwrap();
    assert_eq!(payment.payment_state, "payable");

    // 5. Mark paid
    contract.mark_paid(String::from("lifecycle-task"));

    let payment = contract.get_payment(String::from("lifecycle-task")).unwrap();
    assert_eq!(payment.payment_state, "paid");

    // 6. Verify all events were emitted
    let env = contract.env();
    assert!(env.emitted_event(
        &contract,
        AgentRegistered {
            agent_id: String::from("lifecycle-agent"),
            owner,
            name: String::from("Full Cycle"),
            verifier_function: String::from("verifyInvoiceRisk"),
            wasm_code_hash: String::from("hash_lifecycle"),
        }
    ));

    assert!(env.emitted_event(
        &contract,
        PaymentCreated {
            task_id: String::from("lifecycle-task"),
            agent_id: String::from("lifecycle-agent"),
            payment_amount: U512::from(10_000u64),
        }
    ));

    assert!(env.emitted_event(
        &contract,
        ProofAnchored {
            task_id: String::from("lifecycle-task"),
            input_hash: String::from("input_hash"),
            output_hash: String::from("output_hash"),
            attestation_hash: String::from("attestation_hash"),
        }
    ));

    assert!(env.emitted_event(
        &contract,
        PaymentMarkedPayable {
            task_id: String::from("lifecycle-task"),
        }
    ));

    assert!(env.emitted_event(
        &contract,
        PaymentMarkedPaid {
            task_id: String::from("lifecycle-task"),
        }
    ));
}
