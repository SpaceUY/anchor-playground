import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HelloWorld } from "../target/types/hello_world";
const { SystemProgram } = anchor.web3;

describe("hello-world", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.HelloWorld as Program<HelloWorld>;

  // Create a new keypair for the test account
  const testAccount = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.
    // Send the transaction
    const tx = await program.methods
      .initialize()
      .accounts({
        myAccount: testAccount.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    await program.methods;
    console.log("Your transaction signature", tx);

    const txDetails = await provider.connection.getTransaction(tx, {
      commitment: "confirmed", // Use 'confirmed' to ensure the transaction is confirmed
    });
  });

  it("Calls blast_off", async () => {
    const tx = await program.methods.blastOff().rpc();
    console.log("Hello World transaction signature", tx);

    // Fetch transaction details to get the logs
    const txDetails = await provider.connection.getTransaction(tx, {
      commitment: "confirmed", // Use 'confirmed' to ensure the transaction is confirmed
    });
  });
});
