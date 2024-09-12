import { Keypair } from "@solana/web3.js";

// Generate a new Keypair
const keypair = Keypair.generate();

// Print the public key
console.log("Public Key:", keypair.publicKey.toBase58());

// Print the secret key (this is 64 bytes long)
console.log("Secret Key:", `[${keypair.secretKey.toString()}]`);
