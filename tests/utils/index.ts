import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, AccountInfo } from "@solana/web3.js";

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
      return {
        Name: name,
        Balance: `${balance / LAMPORTS_PER_SOL} SOL`,
        PublicKey: publicKey.toBase58(),
      };
    }
  );

  const balances = await Promise.all(balancePromises);

  console.table(balances);
}

export async function getProgramAccounts(
  provider: AnchorProvider,
  programId: PublicKey
): Promise<{ pubkey: PublicKey; account: AccountInfo<Buffer> }[]> {
  const accounts = await provider.connection.getProgramAccounts(programId);

  // Convert immutable array to mutable array
  return accounts.map(({ pubkey, account }) => ({
    pubkey,
    account,
  }));
}

// Generic function to print program account details
export async function printProgramAccounts(
  provider: AnchorProvider,
  programId: PublicKey,
  message: string
) {
  console.log(message);

  // Fetch all accounts associated with the program
  const accounts = await getProgramAccounts(provider, programId);

  // Process and print each account
  const accountInfoPromises = accounts.map(async ({ pubkey, account }) => {
    // You can add custom logic to decode account data if needed
    // const accountData = account.data.toString("utf-8"); // Adjust based on the data format

    return {
      PublicKey: pubkey.toBase58(),
      // Data: accountData,
    };
  });

  const accountsInfo = await Promise.all(accountInfoPromises);

  console.table(accountsInfo);
}

/**
 * Fetches the owner of the given account and classifies it.
 * @param provider - The AnchorProvider instance to interact with the Solana network.
 * @param accountPublicKey - The public key of the account to check.
 * @param programId - The public key of the program to check against for PDA classification.
 * @returns An object containing the owner's PublicKey and a description of the account type.
 */
export async function getAccountOwner(
  provider: AnchorProvider,
  accountPublicKey: PublicKey,
  programId: PublicKey
): Promise<{ owner: PublicKey; description: string }> {
  // Fetch account info
  const accountInfo = await provider.connection.getAccountInfo(
    accountPublicKey
  );
  if (!accountInfo) {
    throw new Error("Account not found");
  }

  // The owner of the account is the program ID
  const ownerPubkey = accountInfo.owner;

  // Determine the type of owner
  let description: string;

  // Check if it's a PDA
  const isPDA = ownerPubkey.equals(new PublicKey(programId));

  if (ownerPubkey.equals(new PublicKey("11111111111111111111111111111111"))) {
    description = `The account (${accountPublicKey.toBase58()}) is a user account controlled by the System Program.`;
  } else if (isPDA) {
    description = `The account (${accountPublicKey.toBase58()}) is a Program Derived Address (PDA).`;
  } else {
    description = `The account (${accountPublicKey.toBase58()}) is controlled by an unknown program.`;
  }
  console.log(description);
  console.log(`Owner PublicKey: ${ownerPubkey.toBase58()}\n`);

  return { owner: ownerPubkey, description };
}
