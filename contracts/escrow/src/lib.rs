#![no_std]

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Address, Env, Vec, String, symbol_short};

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    Unauthorized = 4,
    NotMilestoneBased = 5,
    NotTimeBased = 6,
    ContractNotActive = 7,
    NoMilestones = 8,
    MilestoneAlreadyCompleted = 9,
    MilestoneNotFound = 10,
    NoSchedule = 11,
    NoReleasesDue = 12,
    InsufficientFunds = 13,
    NotDisputed = 14,
    InvalidResolution = 15,
}

// Contract status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ContractStatus {
    Active,
    Completed,
    Disputed,
}

// Release type enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReleaseType {
    TimeBased,
    MilestoneBased,
}

// Milestone structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub completed: bool,
    pub completed_at: u64,
}

// Time release structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct TimeRelease {
    pub release_date: u64,
    pub amount: i128,
    pub released: bool,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    Client,
    Provider,
    TotalAmount,
    ReleasedAmount,
    ReleaseType,
    Milestones,
    TimeSchedule,
    Status,
    CreatedAt,
    Initialized,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the escrow contract
    pub fn initialize(
        env: Env,
        client: Address,
        provider: Address,
        total_amount: i128,
        release_type: ReleaseType,
    ) -> Result<(), Error> {
        // Check if already initialized
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        // Validate inputs
        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Require authorization from client
        client.require_auth();

        // Store contract data
        env.storage().instance().set(&DataKey::Client, &client);
        env.storage().instance().set(&DataKey::Provider, &provider);
        env.storage().instance().set(&DataKey::TotalAmount, &total_amount);
        env.storage().instance().set(&DataKey::ReleasedAmount, &0i128);
        env.storage().instance().set(&DataKey::ReleaseType, &release_type);
        env.storage().instance().set(&DataKey::Status, &ContractStatus::Active);
        env.storage().instance().set(&DataKey::CreatedAt, &env.ledger().timestamp());
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Initialize empty vectors for milestones and time schedule
        let empty_milestones: Vec<Milestone> = Vec::new(&env);
        let empty_schedule: Vec<TimeRelease> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Milestones, &empty_milestones);
        env.storage().instance().set(&DataKey::TimeSchedule, &empty_schedule);

        // Emit initialization event
        env.events().publish((symbol_short!("init"),), (client, provider, total_amount));

        Ok(())
    }

    /// Add a milestone (only callable by client)
    pub fn add_milestone(
        env: Env,
        id: u32,
        description: String,
        amount: i128,
    ) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        let release_type: ReleaseType = env.storage().instance().get(&DataKey::ReleaseType)
            .ok_or(Error::NotInitialized)?;

        if release_type != ReleaseType::MilestoneBased {
            return Err(Error::NotMilestoneBased);
        }

        let mut milestones: Vec<Milestone> = env.storage().instance()
            .get(&DataKey::Milestones)
            .unwrap_or(Vec::new(&env));

        let milestone = Milestone {
            id,
            description,
            amount,
            completed: false,
            completed_at: 0,
        };

        milestones.push_back(milestone);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        Ok(())
    }

    /// Add a time-based release (only callable by client)
    pub fn add_time_release(
        env: Env,
        release_date: u64,
        amount: i128,
    ) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        let release_type: ReleaseType = env.storage().instance().get(&DataKey::ReleaseType)
            .ok_or(Error::NotInitialized)?;

        if release_type != ReleaseType::TimeBased {
            return Err(Error::NotTimeBased);
        }

        let mut schedule: Vec<TimeRelease> = env.storage().instance()
            .get(&DataKey::TimeSchedule)
            .unwrap_or(Vec::new(&env));

        let time_release = TimeRelease {
            release_date,
            amount,
            released: false,
        };

        schedule.push_back(time_release);
        env.storage().instance().set(&DataKey::TimeSchedule, &schedule);

        Ok(())
    }

    /// Complete a milestone and release funds (only callable by client)
    pub fn complete_milestone(env: Env, milestone_id: u32) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        let status: ContractStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != ContractStatus::Active {
            return Err(Error::ContractNotActive);
        }

        let mut milestones: Vec<Milestone> = env.storage().instance()
            .get(&DataKey::Milestones)
            .ok_or(Error::NoMilestones)?;

        let mut found = false;
        let mut release_amount = 0i128;

        for i in 0..milestones.len() {
            let mut milestone = milestones.get(i).unwrap();
            if milestone.id == milestone_id {
                if milestone.completed {
                    return Err(Error::MilestoneAlreadyCompleted);
                }
                milestone.completed = true;
                milestone.completed_at = env.ledger().timestamp();
                release_amount = milestone.amount;
                milestones.set(i, milestone);
                found = true;
                break;
            }
        }

        if !found {
            return Err(Error::MilestoneNotFound);
        }

        // Update released amount
        let mut released: i128 = env.storage().instance().get(&DataKey::ReleasedAmount).unwrap();
        released += release_amount;
        env.storage().instance().set(&DataKey::ReleasedAmount, &released);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        // Emit event
        env.events().publish(
            (symbol_short!("complete"),),
            (milestone_id, release_amount)
        );

        Ok(())
    }

    /// Release time-based funds (callable by anyone when time has passed)
    pub fn release_time_based(env: Env) -> Result<(), Error> {
        let status: ContractStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != ContractStatus::Active {
            return Err(Error::ContractNotActive);
        }

        let current_time = env.ledger().timestamp();
        let mut schedule: Vec<TimeRelease> = env.storage().instance()
            .get(&DataKey::TimeSchedule)
            .ok_or(Error::NoSchedule)?;

        let mut total_released = 0i128;
        let mut updated = false;

        for i in 0..schedule.len() {
            let mut release = schedule.get(i).unwrap();
            if !release.released && current_time >= release.release_date {
                release.released = true;
                total_released += release.amount;
                schedule.set(i, release);
                updated = true;
            }
        }

        if !updated {
            return Err(Error::NoReleasesDue);
        }

        // Update released amount
        let mut released: i128 = env.storage().instance().get(&DataKey::ReleasedAmount).unwrap();
        released += total_released;
        env.storage().instance().set(&DataKey::ReleasedAmount, &released);
        env.storage().instance().set(&DataKey::TimeSchedule, &schedule);

        // Emit event
        env.events().publish(
            (symbol_short!("release"),),
            total_released
        );

        Ok(())
    }

    /// Withdraw released funds (only callable by provider)
    pub fn withdraw(env: Env, amount: i128) -> Result<(), Error> {
        let provider: Address = env.storage().instance().get(&DataKey::Provider)
            .ok_or(Error::NotInitialized)?;
        
        provider.require_auth();

        let released: i128 = env.storage().instance().get(&DataKey::ReleasedAmount)
            .ok_or(Error::NotInitialized)?;

        if amount > released {
            return Err(Error::InsufficientFunds);
        }

        // Update released amount
        let new_released = released - amount;
        env.storage().instance().set(&DataKey::ReleasedAmount, &new_released);

        // Emit event
        env.events().publish(
            (symbol_short!("withdraw"),),
            (provider.clone(), amount)
        );

        Ok(())
    }

    /// Initiate a dispute (callable by client or provider)
    pub fn dispute(env: Env, caller: Address) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        let provider: Address = env.storage().instance().get(&DataKey::Provider)
            .ok_or(Error::NotInitialized)?;

        // Require auth from caller
        caller.require_auth();

        // Verify caller is either client or provider
        if caller != client && caller != provider {
            return Err(Error::Unauthorized);
        }

        let status: ContractStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != ContractStatus::Active {
            return Err(Error::ContractNotActive);
        }

        env.storage().instance().set(&DataKey::Status, &ContractStatus::Disputed);

        // Emit event
        env.events().publish((symbol_short!("dispute"),), caller);

        Ok(())
    }

    /// Resolve a dispute (admin function - would need admin address in production)
    pub fn resolve_dispute(env: Env, resolution: ContractStatus) -> Result<(), Error> {
        // In production, this would check admin authorization
        // For now, we'll allow the client to resolve
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        let status: ContractStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != ContractStatus::Disputed {
            return Err(Error::NotDisputed);
        }

        if resolution != ContractStatus::Active && resolution != ContractStatus::Completed {
            return Err(Error::InvalidResolution);
        }

        env.storage().instance().set(&DataKey::Status, &resolution);

        // Emit event
        env.events().publish((symbol_short!("resolved"),), ());

        Ok(())
    }

    /// Get contract status
    pub fn get_status(env: Env) -> Result<ContractStatus, Error> {
        env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)
    }

    /// Get released amount
    pub fn get_released_amount(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::ReleasedAmount)
            .ok_or(Error::NotInitialized)
    }

    /// Get total amount
    pub fn get_total_amount(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::TotalAmount)
            .ok_or(Error::NotInitialized)
    }

    /// Get milestones
    pub fn get_milestones(env: Env) -> Result<Vec<Milestone>, Error> {
        env.storage().instance().get(&DataKey::Milestones)
            .ok_or(Error::NotInitialized)
    }

    /// Get time schedule
    pub fn get_time_schedule(env: Env) -> Result<Vec<TimeRelease>, Error> {
        env.storage().instance().get(&DataKey::TimeSchedule)
            .ok_or(Error::NotInitialized)
    }
}
