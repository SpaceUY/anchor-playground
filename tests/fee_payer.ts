import assert from "assert";
import { expect } from "chai";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FeePayer } from "../target/types/fee_payer";
const { SystemProgram, Keypair } = anchor.web3;
import { PublicKey } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, printBalances } from "./utils/index";

describe("Tests for Fee Payer", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  // Account address generated here
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();
  // Set the receiver's public key (this should match the one in your Rust program)
  const receiverPubkey = new PublicKey(
    "3y6mdTynqHFcL2DGSZukvKjcEqFpwCR1A2koPkmkwE28"
  );

  // Get program IDL for fee_payer
  const program = anchor.workspace.FeePayer as Program<FeePayer>;

  let accountsToPrint: Record<string, PublicKey> = {
    Player1: player1.publicKey,
    Player2: player2.publicKey,
    Receiver: receiverPubkey,
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

  it("should transfer SOL from player1 to receiver", async () => {
    const amountToTransfer = 0.5 * LAMPORTS_PER_SOL;

    // Execute the transfer instruction
    await program.methods
      .transferSol(new anchor.BN(amountToTransfer))
      .accounts({
        feePayer: player1.publicKey,
        receiver: receiverPubkey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    // Fetch updated balances
    const [player1Balance, receiverBalance] = await Promise.all([
      provider.connection.getBalance(player1.publicKey),
      provider.connection.getBalance(receiverPubkey),
    ]);

    // Print final balances
    accountsToPrint.Player1 = player1.publicKey;
    accountsToPrint.Receiver = receiverPubkey;

    await printBalances(provider, accountsToPrint, "Final balance");
    // Assertions
    expect(player1Balance).to.be.lessThan(2 * LAMPORTS_PER_SOL);
    expect(receiverBalance).to.be.greaterThan(1.5 * LAMPORTS_PER_SOL);
  });

  it("should fail if receiver is incorrect", async () => {
    const amountToTransfer = 0.1 * LAMPORTS_PER_SOL;
    const wrongReceiverPubkey = new PublicKey(
      "4xD6wJ2hrL8vU9o2bY1h1ovrdXbY8kL6D8u3UJYEqnLS"
    );

    // Attempt to transfer SOL with an incorrect receiver
    try {
      await program.methods
        .transferSol(new anchor.BN(amountToTransfer))
        .accounts({
          feePayer: player1.publicKey,
          receiver: wrongReceiverPubkey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      // Fail the test if the transaction does not throw an error
      assert.fail("Transaction did not fail with the expected error.");
    } catch (err) {
      // Log the error message to find the error code
      console.log("Error message:", err.message);
      // Optionally check for the presence of the error message
      expect(err.message).to.include("InvalidReceiver");
    }
  });
});
