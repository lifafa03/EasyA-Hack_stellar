#![no_std]

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Address, Env, Vec, Map, symbol_short};

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    Unauthorized = 4,
    MilestoneNotFound = 5,
    MilestoneAlreadyCompleted = 6,
    TimeNotReached = 7,
    InsufficientFunds = 8,
    DisputeActive = 9,
    NoDisputeActive = 10,
}

// Escrow status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Active,
    Completed,
    Disputed,
    Cancelled,
}

// Milestone structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u32,
    pub amount: i128,
    pub completed: bool,
}

// Time-based release schedule
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TimeRelease {
    pub release_time: u64,
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
    Status,
    ReleaseType, // "milestone" or "time"
    Milestones,
    TimeSchedule,
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
        release_type: bool, // true for milestone-based, false for time-based
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

        // Store escrow data
        env.storage().instance().set(&DataKey::Client, &client);
        env.storage().instance().set(&DataKey::Provider, &provider);
        env.storage().instance().set(&DataKey::TotalAmount, &total_amount);
        env.storage().instance().set(&DataKey::ReleasedAmount, &0i128);
        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Active);
        env.storage().instance().set(&DataKey::ReleaseType, &release_type);
        env.storage().instance().set(&DataKey::CreatedAt, &env.ledger().timestamp());
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Initialize empty milestone and time schedule vectors
        let milestones: Vec<Milestone> = Vec::new(&env);
        let time_schedule: Vec<TimeRelease> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
        env.storage().instance().set(&DataKey::TimeSchedule, &time_schedule);

        // Emit initialization event
        env.events().publish(
            (symbol_short!("init"),),
            (client, provider, total_amount)
        );

        Ok(())
    }

    /// Add a milestone
    pub fn add_milestone(env: Env, milestone_id: u32, amount: i128) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut milestones: Vec<Milestone> = env.storage().instance()
            .get(&DataKey::Milestones)
            .ok_or(Error::NotInitialized)?;

        milestones.push_back(Milestone {
            id: milestone_id,
            amount,
            completed: false,
        });

        env.storage().instance().set(&DataKey::Milestones, &milestones);

        Ok(())
    }

    /// Add time-based release
    pub fn add_time_release(env: Env, release_time: u64, amount: i128) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut schedule: Vec<TimeRelease> = env.storage().instance()
            .get(&DataKey::TimeSchedule)
            .ok_or(Error::NotInitialized)?;

        schedule.push_back(TimeRelease {
            release_time,
            amount,
            released: false,
        });

        env.storage().instance().set(&DataKey::TimeSchedule, &schedule);

        Ok(())
    }

    /// Complete a milestone and release funds
    pub fn complete_milestone(env: Env, milestone_id: u32) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        
        client.require_auth();

        let status: EscrowStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status == EscrowStatus::Disputed {
            return Err(Error::DisputeActive);
        }

        let mut milestones: Vec<Milestone> = env.storage().instance()
            .get(&DataKey::Milestones)
            .ok_or(Error::NotInitialized)?;

        let mut found = false;
        let mut release_amount = 0i128;

        for i in 0..milestones.len() {
            if let Some(mut milestone) = milestones.get(i) {
                if milestone.id == milestone_id {
                    if milestone.completed {
                        return Err(Error::MilestoneAlreadyCompleted);
                    }
                    milestone.completed = true;
                    release_amount = milestone.amount;
                    milestones.set(i, milestone);
                    found = true;
                    break;
                }
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

        // Emit completion event
        env.events().publish(
            (symbol_short!("complete"),),
            (milestone_id, release_amount)
        );

        Ok(())
    }

    /// Release time-based funds
    pub fn release_time_based(env: Env, index: u32) -> Result<(), Error> {
        let mut schedule: Vec<TimeRelease> = env.storage().instance()
            .get(&DataKey::TimeSchedule)
            .ok_or(Error::NotInitialized)?;

        let mut time_release = schedule.get(index)
            .ok_or(Error::MilestoneNotFound)?;

        if time_release.released {
            return Err(Error::MilestoneAlreadyCompleted);
        }

        let current_time = env.ledger().timestamp();
        if current_time < time_release.release_time {
            return Err(Error::TimeNotReached);
        }

        time_release.released = true;
        schedule.set(index, time_release.clone());

        // Update released amount
        let mut released: i128 = env.storage().instance().get(&DataKey::ReleasedAmount).unwrap();
        released += time_release.amount;
        env.storage().instance().set(&DataKey::ReleasedAmount, &released);
        env.storage().instance().set(&DataKey::TimeSchedule, &schedule);

        // Emit release event
        env.events().publish(
            (symbol_short!("release"),),
            (index, time_release.amount)
        );

        Ok(())
    }

    /// Provider withdraws released funds
    pub fn withdraw(env: Env) -> Result<i128, Error> {
        let provider: Address = env.storage().instance().get(&DataKey::Provider)
            .ok_or(Error::NotInitialized)?;
        
        provider.require_auth();

        let released: i128 = env.storage().instance().get(&DataKey::ReleasedAmount)
            .ok_or(Error::NotInitialized)?;

        if released <= 0 {
            return Err(Error::InsufficientFunds);
        }

        // Reset released amount after withdrawal
        env.storage().instance().set(&DataKey::ReleasedAmount, &0i128);

        // Emit withdrawal event
        env.events().publish(
            (symbol_short!("withdraw"),),
            (provider, released)
        );

        Ok(released)
    }

    /// Initiate dispute
    pub fn dispute(env: Env) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client)
            .ok_or(Error::NotInitialized)?;
        let provider: Address = env.storage().instance().get(&DataKey::Provider)
            .ok_or(Error::NotInitialized)?;
        
        // Either party can initiate dispute
        if !client.require_auth_for_args(()).is_ok() && !provider.require_auth_for_args(()).is_ok() {
            return Err(Error::Unauthorized);
        }

        env.storage().instance().set(&DataKey::Status, &EscrowStatus::Disputed);

        // Emit dispute event
        env.events().publish(
            (symbol_short!("dispute"),),
            ()
        );

        Ok(())
    }

    /// Resolve dispute (admin only in production)
    pub fn resolve_dispute(env: Env, refund_to_client: bool) -> Result<(), Error> {
        let status: EscrowStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != EscrowStatus::Disputed {
            return Err(Error::NoDisputeActive);
        }

        if refund_to_client {
            env.storage().instance().set(&DataKey::Status, &EscrowStatus::Cancelled);
        } else {
            env.storage().instance().set(&DataKey::Status, &EscrowStatus::Completed);
        }

        Ok(())
    }

    /// Query functions
    pub fn get_status(env: Env) -> Result<EscrowStatus, Error> {
        env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_total_amount(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::TotalAmount)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_released_amount(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::ReleasedAmount)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_milestones(env: Env) -> Result<Vec<Milestone>, Error> {
        env.storage().instance().get(&DataKey::Milestones)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_time_schedule(env: Env) -> Result<Vec<TimeRelease>, Error> {
        env.storage().instance().get(&DataKey::TimeSchedule)
            .ok_or(Error::NotInitialized)
    }
}

