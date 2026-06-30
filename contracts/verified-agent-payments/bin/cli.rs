//! CLI tool for verified_agent_payments smart contract.

use verified_agent_payments::VerifiedAgentPayments;
use odra::host::{HostEnv, NoArgs};
use odra_cli::{
    deploy::DeployScript,
    scenario::{Args, Error, Scenario, ScenarioMetadata},
    CommandArg, DeployedContractsContainer, DeployerExt,
    OdraCli,
};

pub struct VerifiedAgentPaymentsDeployScript;

impl DeployScript for VerifiedAgentPaymentsDeployScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer
    ) -> Result<(), odra_cli::deploy::Error> {
        let _contract = VerifiedAgentPayments::load_or_deploy(
 &env,
 NoArgs,
 container,
 350_000_000_000,
        )?;

        Ok(())
    }
}

pub struct NoopScenario;

impl Scenario for NoopScenario {
    fn args(&self) -> Vec<CommandArg> {
        vec![]
    }

    fn run(
        &self,
        _env: &HostEnv,
        _container: &DeployedContractsContainer,
        _args: Args
    ) -> Result<(), Error> {
        Ok(())
    }
}

impl ScenarioMetadata for NoopScenario {
    const NAME: &'static str = "noop";
    const DESCRIPTION: &'static str = "No-op scenario placeholder";
}

pub fn main() {
    OdraCli::new()
        .about("CLI tool for verified_agent_payments smart contract")
        .deploy(VerifiedAgentPaymentsDeployScript)
        .contract::<VerifiedAgentPayments>()
        .scenario(NoopScenario)
        .build()
        .run();
}
