"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
// Generate a new Keypair
var keypair = web3_js_1.Keypair.generate();
// Print the public key
console.log("Public Key:", keypair.publicKey.toBase58());
// Print the secret key (this is 64 bytes long)
console.log("Secret Key:", "[".concat(keypair.secretKey.toString(), "]"));
