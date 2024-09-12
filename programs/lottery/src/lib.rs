use anchor_lang::prelude::*;

// This declares the program ID, which is the unique identifier for your Solana program.
declare_id!("HLkognudb187tQonWj95oR3hFTrxHaR53AUYHLAfwec");

#[program]
mod lottery {
    use super::*;       

    // This function initializes the lottery by creating a new lottery account.
    // It sets the lottery authority, ticket price, and oracle public key.
    pub fn initialise_lottery(ctx: Context<Create>, ticket_price: u64, oracle_pubkey: Pubkey) -> Result<()> {        
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;  // Get mutable reference to the lottery account
        lottery.authority = ctx.accounts.admin.key();   // Set the admin's public key as the lottery authority
        lottery.count = 0;           // Initialize the ticket counter to 0
        lottery.ticket_price = ticket_price;  // Set the price of each lottery ticket
        lottery.oracle = oracle_pubkey;  // Set the oracle's public key

        Ok(())
    }

    // This function allows a player to buy a lottery ticket.
    // It transfers lamports (Solana's native currency) to the lottery account and creates a ticket.
    pub fn buy_ticket(ctx: Context<Submit>) -> Result<()> {
        
        // Deserializes (unpacks) the lottery account data so we can modify it
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;          
        let player: &mut Signer = &mut ctx.accounts.player;  // Get a mutable reference to the player (signer)

        // Create a transfer instruction to move lamports from the player to the lottery account
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &player.key(),
            &lottery.key(),
            lottery.ticket_price,  // Amount to transfer is the price of a ticket
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                player.to_account_info(),
                lottery.to_account_info(),
            ],
        )?;

        // Deserializes (unpacks) the ticket account data so we can modify it
        let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;                

        // Set the ticket's submitter to the player's public key
        ticket.submitter = ctx.accounts.player.key();

        // Set the ticket's index to the current value of the lottery's ticket counter
        ticket.idx = lottery.count;        

        // Increment the lottery's ticket counter by 1
        lottery.count += 1;                      

        Ok(())  
    }
    
    // This function allows the oracle to pick a winning ticket.
    // The oracle specifies which ticket (by index) is the winner.
    pub fn pick_winner(ctx: Context<Winner>, winner: u32) -> Result<()> {

        // Deserializes (unpacks) the lottery account data so we can modify it
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        
        // Set the lottery's winner index to the specified value
        lottery.winner_index = winner;                

        Ok(())
    }    

    // This function pays out the prize to the winner.
    // It transfers all the lamports from the lottery account to the winner's account.
    pub fn pay_out_winner(ctx: Context<Payout>) -> Result<()> {

        // Deserializes (unpacks) the lottery account data so we can modify it
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        let recipient: &mut AccountInfo =  &mut ctx.accounts.winner;  // Get a mutable reference to the winner's account

        // Get the total amount of lamports in the lottery account
        let balance: u64 = lottery.to_account_info().lamports();                      
            
        // Transfer the lamports from the lottery account to the winner's account
        **lottery.to_account_info().try_borrow_mut_lamports()? -= balance;
        **recipient.to_account_info().try_borrow_mut_lamports()? += balance; 
        
        Ok(())
    }
}

// Contexts: These structs define the required accounts and constraints for each instruction.
////////////////////////////////////////////////////////////////

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer = admin, space = 8 + 180)]  // Initialize the lottery account with enough space
    pub lottery: Account<'info, Lottery>,  // The lottery account
    #[account(mut)]
    pub admin: Signer<'info>,  // The admin (who pays for account creation)    
    pub system_program: Program<'info, System>,  // Reference to the Solana system program
}

#[derive(Accounts)]
pub struct Submit<'info> {            
    #[account(init, 
        seeds = [
            &lottery.count.to_be_bytes(), 
            lottery.key().as_ref()
        ], 
        constraint = player.to_account_info().lamports() >= lottery.ticket_price,
        bump, 
        payer = player, 
        space=80
    )]
    pub ticket: Account<'info, Ticket>,  // The ticket account (created for the player)        
    #[account(mut)]                                 
    pub player: Signer<'info>,  // The player who buys the ticket (and pays for account creation)   
    #[account(mut)]       
    pub lottery: Account<'info, Lottery>,  // The lottery account to retrieve and increment the counter        
    pub system_program: Program<'info, System>,  // Reference to the Solana system program    
}

#[derive(Accounts)]
pub struct Winner<'info> {    
    #[account(mut, constraint = lottery.oracle == *oracle.key)]
    pub lottery: Account<'info, Lottery>,  // The lottery account where the winner is selected        
    pub oracle: Signer<'info>,  // The oracle responsible for picking the winner
}

#[derive(Accounts)]
pub struct Payout<'info> {             
    #[account(mut, 
        constraint = 
        ticket.submitter == *winner.key && 
        ticket.idx == lottery.winner_index        
    )]       
    pub lottery: Account<'info, Lottery>,  // The lottery account (to assert the winner and withdraw lamports)
    #[account(mut)]       
    /// CHECK: Not dangerous as it only receives lamports
    pub winner: AccountInfo<'info>,  // The winner's account
    #[account(mut)]                  
    pub ticket: Account<'info, Ticket>,  // The winning ticket
}

// Accounts: These structs define the structure of the data stored in each account.
////////////////////////////////////////////////////////////////

// Lottery account structure
#[account]
pub struct Lottery {    
    pub authority: Pubkey,  // The admin's public key
    pub oracle: Pubkey,  // The oracle's public key
    pub winner: Pubkey,  // The winner's public key (this might not be needed here if only winner_index is used)
    pub winner_index: u32,  // The index of the winning ticket
    pub count: u32,  // The total number of tickets sold
    pub ticket_price: u64,  // The price of each ticket
}

// Ticket account structure
#[account]
#[derive(Default)] 
pub struct Ticket {    
    pub submitter: Pubkey,  // The public key of the person who bought the ticket    
    pub idx: u32,  // The index of the ticket
}
