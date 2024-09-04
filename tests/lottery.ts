import assert from "assert";
import { expect } from "chai";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
const { SystemProgram, Keypair } = anchor.web3;
import { PublicKey } from "@solana/web3.js";
import {
  getAccountOwner,
  LAMPORTS_PER_SOL,
  printBalances,
  printProgramAccounts,
} from "./utils/index";

describe("Tests for lottery", async () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(anchor.AnchorProvider.local());

  // Account address generated here
  const lottery = Keypair.generate();
  const lottery_admin = Keypair.generate();
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();
  const skintPlayer3 = Keypair.generate();
  const oracle = Keypair.generate();

  // Get program IDL for rock-paper-scissor
  const program = anchor.workspace.Lottery as Program<Lottery>;

  let accountsToPrint: Record<string, PublicKey> = {
    Player1: player1.publicKey,
    Player2: player2.publicKey,
    SkintPlayer3: skintPlayer3.publicKey,
    Lottery: lottery.publicKey,
    "Lottery Admin": lottery_admin.publicKey,
  };

  before(async () => {
    // Create an array of airdrop requests
    const airdropPromises = [
      provider.connection.requestAirdrop(
        player1.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      provider.connection.requestAirdrop(
        player2.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      provider.connection.requestAirdrop(
        lottery_admin.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      provider.connection.requestAirdrop(
        skintPlayer3.publicKey,
        0.4 * LAMPORTS_PER_SOL
      ),
    ];

    // Send all airdrop requests concurrently
    const airdropTxs = await Promise.all(airdropPromises);

    // Confirm all airdrop transactions
    const confirmPromises = airdropTxs.map((tx) =>
      provider.connection.confirmTransaction(tx)
    );
    await Promise.all(confirmPromises);
    // Print balances
    await printBalances(provider, accountsToPrint, "Initial balance");
  });

  it("Creates a lottery account", async () => {
    const accounts = {
      lottery: lottery.publicKey,
      admin: lottery_admin.publicKey,
      systemProgram: SystemProgram.programId,
    };
    await program.methods
      .initialiseLottery(new anchor.BN(LAMPORTS_PER_SOL), oracle.publicKey)
      .accounts(accounts)
      .signers([lottery, lottery_admin])
      .rpc();

    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);

    // Assert lottery intiliased to zero
    expect(lotteryState.count).to.equal(0);

    // Assert authority matches lottery admin
    expect(lotteryState.authority.toString()).to.equal(
      lottery_admin.publicKey.toString()
    );

    // Assert ticket price has been set
    expect(lotteryState.ticketPrice.toNumber()).to.equal(LAMPORTS_PER_SOL);

    // Print balances
    await printBalances(
      provider,
      accountsToPrint,
      "Lottery admin paid lottery creation [1 SOL per Ticket]"
    );
  });

  it("Submits a bid as player1", async () => {
    // Get starting balances for player1 and lottery account
    let startBalancePlayer: number = await provider.connection.getBalance(
      player1.publicKey
    );
    let startBalanceLottery: number = await provider.connection.getBalance(
      lottery.publicKey
    );

    // Get lottery index
    let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
      .count;
    // Consutruct buffer containing latest index
    const buf1 = Buffer.alloc(4);
    buf1.writeUIntBE(idx, 0, 4);

    const [ticket, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [buf1, lottery.publicKey.toBytes()],
      program.programId
    );

    const accounts = {
      lottery: lottery.publicKey,
      player: player1.publicKey,
      systemProgram: SystemProgram.programId,
    };
    // Get lottery ticket
    await program.methods
      .buyTicket()
      .accounts(accounts)
      .signers([player1])
      .rpc();

    // Assert submitters key matches the one provided
    let submissionState = await program.account.ticket.fetch(ticket);
    expect(submissionState.submitter.toString()).to.equal(
      player1.publicKey.toString()
    );
    // Get ending balances for player and lottery
    let endBalanacePlayer: number = await provider.connection.getBalance(
      player1.publicKey
    );
    let endBalanceLottery: number = await provider.connection.getBalance(
      lottery.publicKey
    );

    // Assert lottery lamport balance is higher
    expect(endBalanceLottery).to.be.greaterThan(startBalanceLottery);

    // Assert player lamport balance is lower
    expect(startBalancePlayer).to.be.greaterThan(endBalanacePlayer);

    // Assert lottery incremented to 1
    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.count).to.equal(idx + 1);
    await getAccountOwner(provider, player1.publicKey, program.programId);
    await getAccountOwner(provider, ticket, program.programId);
    accountsToPrint["Ticket 1"] = ticket;
    await printBalances(provider, accountsToPrint, "Payer 1 buy a ticket");
  });

  it("Submits a bid as player2", async () => {
    // Get starting balances for player and lottery account
    let startBalancePlayer: number = await provider.connection.getBalance(
      player2.publicKey
    );
    let startBalanceLottery: number = await provider.connection.getBalance(
      lottery.publicKey
    );

    // Get lottery index
    let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
      .count;
    // Consutruct buffer containing latest index
    const buf1 = Buffer.alloc(4);
    buf1.writeUIntBE(idx, 0, 4);

    const [ticket, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [buf1, lottery.publicKey.toBytes()],
      program.programId
    );
    const accounts = {
      lottery: lottery.publicKey,
      player: player2.publicKey,
      ticket: ticket,
      systemProgram: SystemProgram.programId,
    };
    // Get lottery ticket
    await program.methods
      .buyTicket()
      .accounts(accounts)
      .signers([player2])
      .rpc();

    // Get ending balances for player and lottery
    let endBalanacePlayer = await provider.connection.getBalance(
      player2.publicKey
    );
    let endBalanceLottery: number = await provider.connection.getBalance(
      lottery.publicKey
    );

    // Assert player lamport balance is lower
    expect(startBalancePlayer).to.be.greaterThan(endBalanacePlayer);

    // Assert lottery lamport balance is higher
    expect(endBalanceLottery).to.be.greaterThan(startBalanceLottery);

    // Assert lottery counter incremented by 1
    let lotteryState: number = (
      await program.account.lottery.fetch(lottery.publicKey)
    ).count;
    expect(lotteryState).to.equal(idx + 1);

    // Assert submitters key matches the one provided
    let submissionState = await program.account.ticket.fetch(ticket);
    expect(submissionState.submitter.toString()).to.equal(
      player2.publicKey.toString()
    );

    await getAccountOwner(provider, player2.publicKey, program.programId);
    await getAccountOwner(provider, ticket, program.programId);
    accountsToPrint["Ticket 2"] = ticket;
    await printBalances(provider, accountsToPrint, "Payer 2 buy a ticket");
  });

  it("Can't submit as player3 with no money", async () => {
    try {
      // Get lottery index
      let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
        .count;
      // Consutruct buffer containing latest index
      const buf1 = Buffer.alloc(4);
      buf1.writeUIntBE(idx, 0, 4);

      const [ticket, bump] = await anchor.web3.PublicKey.findProgramAddress(
        [buf1, lottery.publicKey.toBytes()],
        program.programId
      );
      const accounts = {
        lottery: lottery.publicKey,
        player: skintPlayer3.publicKey,
        ticket: ticket,
        systemProgram: SystemProgram.programId,
      };
      // Get lottery ticket
      await program.methods
        .buyTicket()
        .accounts(accounts)
        .signers([skintPlayer3])
        .rpc();
      assert(false);
    } catch (err) {
      const errMsg =
        "AnchorError caused by account: ticket. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated.";
      assert.equal(err.toString(), errMsg);
    }
  });

  it("Oracle picks winner", async () => {
    // Oracle will pick second ticket [0,1]
    // number one is the second submission so player2
    let winnerIndex: number = 1;

    // Get oracle picks winner index
    await program.methods
      .pickWinner(winnerIndex)
      .accounts({
        lottery: lottery.publicKey,
        oracle: oracle.publicKey,
      })
      .signers([oracle])
      .rpc();

    // Assert that the winner index has been picked
    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.winnerIndex).to.equal(winnerIndex);
  });

  it("Winner withdraws funds", async () => {
    // Get winners starting balance
    let startBalance: number = await provider.connection.getBalance(
      player2.publicKey
    );

    // Get winner idx
    let winnerIdx: number = (
      await program.account.lottery.fetch(lottery.publicKey)
    ).winnerIndex;

    const buf1 = Buffer.alloc(4);
    buf1.writeUIntBE(winnerIdx, 0, 4);

    // Derive PDA of ticket
    const [ticket, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [buf1, lottery.publicKey.toBytes()],
      program.programId
    );

    // Get lottery ticket
    await program.methods
      .payOutWinner()
      .accounts({
        ticket: ticket,
        lottery: lottery.publicKey,
        winner: player2.publicKey,
      })
      .signers([])
      .rpc();

    // Assert winner got the payout
    let endBalanace = await provider.connection.getBalance(player2.publicKey);
    expect(endBalanace).to.be.greaterThan(startBalance);
  });
});
