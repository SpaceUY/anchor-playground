use anchor_lang::prelude::*;

declare_id!("4RBuBKF3rJy45jbMMiUs8BfkfNeDJBf48TNrRgxEr8cU");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Initializing SpaceDev 🚀 Hello World");
        msg!("Program ID: {:?}", ctx.program_id);
        Ok(())
    }
  
    pub fn blast_off(ctx: Context<BlastOff>) -> Result<()> {
        msg!("Blast off with SpaceDev!, Enjoy the ride, Solana Boy! 🌌");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct BlastOff {}