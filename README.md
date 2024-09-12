# SpaceDev Anchor Playground

Welcome to the SpaceDev Anchor Playground repository! This repository is designed to help you take your first steps with Anchor and Solana while working within SpaceDev.
It's a great starting point for learning and experimenting with Solana.
As you explore and work with this repository, feel free to contribute and share your insights.

Enjoy the journey! 🚀

## Environment Setup

Before you begin, make sure you have the following installed on your system:

Solana CLI: This is required for interacting with the Solana blockchain.
Rust: The programming language needed for building and deploying Anchor programs.
During setup, you might encounter a common issue related to missing dependencies or outdated configurations. The following steps will help resolve these issues by ensuring that all necessary tools are properly installed and configured.

1. **Install Dependencies and Config**

```bash
rm -rf test-ledger

brew install gnu-tar

export PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$PATH"
```

To check if you're running Solana on devnet, testnet, or localnet, you can use the command solana config get in the terminal.

```bash
solana config get
```

If your RPC URL is not localnet, you should do this:

Start a localnet node: If you haven't already, you first need to start a local node on your machine. You can do this with the following command:

```bash
solana-test-validator
```

Change Solana configuration to localnet: Once the localnet node is running, you need to change Solana's configuration to use this local node instead of devnet. Use the following command:

```bash
solana config set --url http://localhost:8899
```

2. **Build and Deploy**

- Install dependencies:

```bash
yarn install
```

- To build:
  All:

```bash
anchor build
```

Olny only by program name:

```bash
anchor build -p <program_name>
```

- To deploy (run solana-test-validator before):
  All:

```bash
anchor deploy
```

Olny only by program name:

```bash
anchor deploy -p <program_name>
```

**After deployment, copy the Program ID and replace it in the program declare_id! macro and the Anchor.toml file.**

## How to Run Test and check logs

### Run Validator, Anchor Test Skipping Local Validator and Check Logs

For a smooth testing experience, we recommend using three separate terminal windows:

Local Node Terminal: Start your local Solana node in one terminal. This will keep the node running and ready for testing.

```bash
solana-test-validator
```

Log Monitoring Terminal: In a second terminal, monitor the logs for program outputs. This will help you track the progress and debug any issues.

```bash
solana logs | grep "Program log:"
```

Test Execution Terminal: In the third terminal, execute your Anchor tests. This will run your tests while using the local node and show any relevant output.

```bash
anchor test -p fee_payer --skip-local-validator --skip-deploy
```

### Running Tests Only

If your goal is simply to run the tests without skipping the local validator, use the following command:

```bash
   anchor test
```
