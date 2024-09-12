use anchor_lang::prelude::*;

declare_id!("9Qt4N8UhuTtgWzkf8hKqEYjbzdpD5B7eb7vyhccArFG1");

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