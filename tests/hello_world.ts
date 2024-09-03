import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HelloWorld } from "../target/types/hello_world";

describe("Tests for hello-world", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.HelloWorld as Program<HelloWorld>;

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().rpc();
    await program.methods;
    console.log("Your transaction signature", tx);
  });

  it("Calls blast_off", async () => {
    const tx = await program.methods.blastOff().rpc();
    console.log("Hello World transaction signature", tx);
  });
});
