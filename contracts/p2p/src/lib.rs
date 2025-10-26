#![no_std]

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Address, Env, symbol_short};

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    Unauthorized = 4,
    TransactionNotPending = 5,
    TransactionAlreadyCompleted = 6,
    TransactionAlreadyCancelled = 7,
}

// Transaction status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Cancelled,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    Sender,
    Receiver,
    Amount,
    UseEscrow,
    Status,
    CreatedAt,
    Initialized,
}

#[contract]
pub struct P2PContract;

#[contractimpl]
impl P2PContract {
    /// Send funds directly without escrow (instant transfer)
    pub fn send_direct(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
    ) -> Result<(), Error> {
        sender.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // In a real implementation, this would transfer tokens
        // For now, we just emit an event
        env.events().publish(
            (symbol_short!("direct"),),
            (sender, receiver, amount)
        );

        Ok(())
    }

    /// Send funds with escrow protection
    pub fn send_with_escrow(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // Check if already initialized
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        sender.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Store transaction data
        env.storage().instance().set(&DataKey::Sender, &sender);
        env.storage().instance().set(&DataKey::Receiver, &receiver);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::UseEscrow, &true);
        env.storage().instance().set(&DataKey::Status, &TransactionStatus::Pending);
        env.storage().instance().set(&DataKey::CreatedAt, &env.ledger().timestamp());
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Emit escrow creation event
        env.events().publish(
            (symbol_short!("escrow"),),
            (sender, receiver, amount)
        );

        Ok(())
    }

    /// Confirm receipt and release funds (only callable by receiver)
    pub fn confirm_receipt(env: Env) -> Result<(), Error> {
        let receiver: Address = env.storage().instance().get(&DataKey::Receiver)
            .ok_or(Error::NotInitialized)?;

        receiver.require_auth();

        let status: TransactionStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != TransactionStatus::Pending {
            return Err(Error::TransactionNotPending);
        }

        let amount: i128 = env.storage().instance().get(&DataKey::Amount)
            .ok_or(Error::NotInitialized)?;

        // Update status
        env.storage().instance().set(&DataKey::Status, &TransactionStatus::Completed);

        // Emit completion event
        env.events().publish(
            (symbol_short!("confirm"),),
            (receiver, amount)
        );

        Ok(())
    }

    /// Cancel pending transaction (only callable by sender)
    pub fn cancel(env: Env) -> Result<(), Error> {
        let sender: Address = env.storage().instance().get(&DataKey::Sender)
            .ok_or(Error::NotInitialized)?;

        sender.require_auth();

        let status: TransactionStatus = env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)?;

        if status != TransactionStatus::Pending {
            return Err(Error::TransactionNotPending);
        }

        let amount: i128 = env.storage().instance().get(&DataKey::Amount)
            .ok_or(Error::NotInitialized)?;

        // Update status
        env.storage().instance().set(&DataKey::Status, &TransactionStatus::Cancelled);

        // Emit cancellation event
        env.events().publish(
            (symbol_short!("cancel"),),
            (sender, amount)
        );

        Ok(())
    }

    /// Get transaction status
    pub fn get_status(env: Env) -> Result<TransactionStatus, Error> {
        env.storage().instance().get(&DataKey::Status)
            .ok_or(Error::NotInitialized)
    }

    /// Get transaction amount
    pub fn get_amount(env: Env) -> Result<i128, Error> {
        env.storage().instance().get(&DataKey::Amount)
            .ok_or(Error::NotInitialized)
    }

    /// Get sender address
    pub fn get_sender(env: Env) -> Result<Address, Error> {
        env.storage().instance().get(&DataKey::Sender)
            .ok_or(Error::NotInitialized)
    }

    /// Get receiver address
    pub fn get_receiver(env: Env) -> Result<Address, Error> {
        env.storage().instance().get(&DataKey::Receiver)
            .ok_or(Error::NotInitialized)
    }

    /// Check if transaction uses escrow
    pub fn uses_escrow(env: Env) -> Result<bool, Error> {
        env.storage().instance().get(&DataKey::UseEscrow)
            .ok_or(Error::NotInitialized)
    }
}
