#![no_std]

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Address, Env, Map, symbol_short};

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    InvalidDeadline = 4,
    Unauthorized = 5,
    PoolNotFunding = 6,
    DeadlineNotReached = 7,
    GoalNotMet = 8,
    GoalAlreadyMet = 9,
    NoContribution = 10,
    PoolNotFailed = 11,
}

// Pool status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PoolStatus {
    Funding,
    Funded,
    Failed,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    ProjectOwner,
    FundingGoal,
    Deadline,
    TotalRaised,
    Contributors,
    Status,
    CreatedAt,
    Initialized,
}

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    /// Initialize the crowdfunding pool
    pub fn initialize(
        env: Env,
        project_owner: Address,
        funding_goal: i128,
        deadline: u64,
    ) -> Result<(), Error> {
        // Check if already initialized
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        // Validate inputs
        if funding_goal <= 0 {
            return Err(Error::InvalidAmount);
        }

        let current_time = env.ledger().timestamp();
        if deadline <= current_time {
            return Err(Error::InvalidDeadline);
        }

        // Require authorization from project owner
        project_owner.require_auth();

        // Store pool data
        env.storage().instance().set(&DataKey::ProjectOwner, &project_owner);
        env.storage().instance().set(&DataKey::FundingGoal, &funding_goal);
        env.storage().instance().set(&DataKey::Deadline, &deadline);
        env.storage().instance().set(&DataKey::TotalRaised, &0i128);
        env.storage().instance().set(&DataKey::Status, &PoolStatus::Funding);
        env.storage().instance().set(&DataKey::CreatedAt, &current_time);
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Initialize empty contributors map
        let contributors: Map<Address, i128> = Map::new(&env);
        env.storage().instance().set(&DataKey::Contributors, &contributors);

        // Emit initialization event
        env.events().publish(
            (symbol_short!("init"),),
            (project_owner, funding_goal, deadline)
        );

        Ok(())
    }

    /// Contribute to the pool
    pub fn contribute(env: Env, contributor: Address, amount: i128) -> Result<(), Error> {
        contributor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let status: PoolStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != PoolStatus::Funding {
            return Err(Error::PoolNotFunding);
        }

        // Check deadline hasn't passed
        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline)
            .ok_or(Error::NotInitialized)?;
        let current_time = env.ledger().timestamp();
        
        if current_time >= deadline {
            return Err(Error::DeadlineNotReached);
        }

        // Update contributor's total contribution
        let mut contributors: Map<Address, i128> = env.storage().instance()
            .get(&DataKey::Contributors)
            .ok_or(Error::NotInitialized)?;

        let current_contribution = contributors.get(contributor.clone()).unwrap_or(0);
        contributors.set(contributor.clone(), current_contribution + amount);

        // Update total raised
        let mut total_raised: i128 = env.storage().instance().get(&DataKey::TotalRaised).unwrap();
        total_raised += amount;

        env.storage().instance().set(&DataKey::TotalRaised, &total_raised);
        env.storage().instance().set(&DataKey::Contributors, &contributors);

        // Emit contribution event
        env.events().publish(
            (symbol_short!("contrib"),),
            (contributor, amount, total_raised)
        );

        Ok(())
    }

    /// Finalize the pool (check if goal met and update status)
    pub fn finalize(env: Env) -> Result<(), Error> {
        let status: PoolStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != PoolStatus::Funding {
            return Err(Error::PoolNotFunding);
        }

        // Check deadline has passed
        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline)
            .ok_or(Error::NotInitialized)?;
        let current_time = env.ledger().timestamp();
        
        if current_time < deadline {
            return Err(Error::DeadlineNotReached);
        }

        let total_raised: i128 = env.storage().instance().get(&DataKey::TotalRaised)
            .ok_or(Error::NotInitialized)?;
        let funding_goal: i128 = env.storage().instance().get(&DataKey::FundingGoal)
            .ok_or(Error::NotInitialized)?;

        let new_status = if total_raised >= funding_goal {
            PoolStatus::Funded
        } else {
            PoolStatus::Failed
        };

        env.storage().instance().set(&DataKey::Status, &new_status);

        // Emit finalization event
        env.events().publish(
            (symbol_short!("finalize"),),
            (new_status.clone(), total_raised)
        );

        Ok(())
    }

    /// Request refund (only if pool failed)
    pub fn refund(env: Env, contributor: Address) -> Result<i128, Error> {
        contributor.require_auth();

        let status: PoolStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != PoolStatus::Failed {
            return Err(Error::PoolNotFailed);
        }

        let mut contributors: Map<Address, i128> = env.storage().instance()
            .get(&DataKey::Contributors)
            .ok_or(Error::NotInitialized)?;

        let contribution = contributors.get(contributor.clone())
            .ok_or(Error::NoContribution)?;

        if contribution == 0 {
            return Err(Error::NoContribution);
        }

        // Remove contributor's entry (set to 0)
        contributors.set(contributor.clone(), 0);
        env.storage().instance().set(&DataKey::Contributors, &contributors);

        // Emit refund event
        env.events().publish(
            (symbol_short!("refund"),),
            (contributor, contribution)
        );

        Ok(contribution)
    }

    /// Get pool status
    pub fn get_status(env: Env) -> Result<PoolStatus, Error> {
        env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)
    }

    /// Get total raised amount
    pub fn get_total_raised(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::TotalRaised)
            .ok_or(Error::NotInitialized)
    }

    /// Get funding goal
    pub fn get_funding_goal(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::FundingGoal)
            .ok_or(Error::NotInitialized)
    }

    /// Get deadline
    pub fn get_deadline(env: Env) -> Result<u64, Error> {
        env.storage().instance().get(&DataKey::Deadline)
            .ok_or(Error::NotInitialized)
    }

    /// Get contributor's contribution amount
    pub fn get_contribution(env: Env, contributor: Address) -> Result<i128, Error> {
        let contributors: Map<Address, i128> = env.storage().instance()
            .get(&DataKey::Contributors)
            .ok_or(Error::NotInitialized)?;

        Ok(contributors.get(contributor).unwrap_or(0))
    }

    /// Get project owner
    pub fn get_project_owner(env: Env) -> Result<Address, Error> {
        env.storage().instance().get(&DataKey::ProjectOwner)
            .ok_or(Error::NotInitialized)
    }
}
