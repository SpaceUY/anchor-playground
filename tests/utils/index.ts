import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const LAMPORTS_PER_SOL = 1000000000;

export async function printBalances(
  provider: AnchorProvider,
  accounts: Record<string, PublicKey>,
  message: string
) {
  console.log(message);

  const balancePromises = Object.entries(accounts).map(
    async ([name, publicKey]) => {
      const balance = await provider.connection.getBalance(publicKey);
      return { Name: name, Balance: `${balance / LAMPORTS_PER_SOL} SOL` };
    }
  );

  const balances = await Promise.all(balancePromises);

  console.table(balances);
}
