use anchor_lang::prelude::*;
use std::str::FromStr;

declare_id!("5HvJqqCJRTjLya5eEd8wSbZh2zhBUnNgySdViGkZoAwZ");

const RECEIVER_PUBKEY: &str = "3y6mdTynqHFcL2DGSZukvKjcEqFpwCR1A2koPkmkwE28";

#[program]
pub mod fee_payer {
    use super::*;

    pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.fee_payer.key(),
            &ctx.accounts.receiver.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[ctx.accounts.fee_payer.to_account_info(),ctx.accounts.receiver.to_account_info()],
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        constraint = receiver.key() == Pubkey::from_str(RECEIVER_PUBKEY).unwrap() @ ErrorCode::InvalidReceiver
    )]
    pub receiver: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The receiver account does not match the specified fixed account.")]
    InvalidReceiver,
}