import "dotenv/config";
import { artifacts } from "hardhat";
import { 
  createWalletClient, 
  createPublicClient, 
  http, 
  parseUnits, 
  getAddress,
  defineChain 
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Environment variables with validation
const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");

// Token configuration
const NAME = process.env.TOKEN_NAME || "CampusCredit";
const SYMBOL = process.env.TOKEN_SYMBOL || "CAMP";
const CAP_HUMAN = process.env.TOKEN_CAP || "2000000";
const INIT_HUMAN = process.env.TOKEN_INITIAL || "1000000";

/**
 * Main deployment function
 * Deploys CampusCredit token with specified parameters
 */
async function main() {
  // Validate required environment variables
  if (!RPC_URL || !CHAIN_ID || !PRIVATE_KEY) {
    throw new Error("Missing required environment variables: RPC_URL, CHAIN_ID, or PRIVATE_KEY");
  }

  console.log("Starting CampusCredit deployment...");
  console.log(`Token Name: ${NAME}`);
  console.log(`Token Symbol: ${SYMBOL}`);
  console.log(`Token Cap: ${CAP_HUMAN} tokens`);
  console.log(`Initial Mint: ${INIT_HUMAN} tokens`);
  console.log(`Network: ${RPC_URL}`);
  console.log(`Chain ID: ${CHAIN_ID}\n`);

  // Load contract artifacts
  const { abi, bytecode } = await artifacts.readArtifact("CampusCredit");

  // Configure custom chain
  const chain = defineChain({
    id: CHAIN_ID,
    name: `chain-${CHAIN_ID}`,
    nativeCurrency: { 
      name: "ETH", 
      symbol: "ETH", 
      decimals: 18 
    },
    rpcUrls: { 
      default: { 
        http: [RPC_URL] 
      } 
    },
  });

  // Setup account and clients
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  const wallet = createWalletClient({ 
    account, 
    chain, 
    transport: http(RPC_URL) 
  });
  const publicClient = createPublicClient({ 
    chain, 
    transport: http(RPC_URL) 
  });

  // Convert human-readable amounts to wei
  const cap = parseUnits(CAP_HUMAN, 18);
  const initialMint = parseUnits(INIT_HUMAN, 18);

  // Display deployment info
  console.log(`Deployer Address: ${getAddress(account.address)}`);
  console.log(`Cap (wei): ${cap.toString()}`);
  console.log(`Initial Mint (wei): ${initialMint.toString()}\n`);

  try {
    // Deploy the contract
    console.log("Deploying contract...");
    const hash = await wallet.deployContract({
      abi,
      bytecode: bytecode as '0x${string}',
      args: [
        NAME, 
        SYMBOL, 
        cap, 
        getAddress(account.address), 
        initialMint
      ],
      maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei priority fee
      maxFeePerGas: 20_000_000_000n,        // 20 gwei max fee
    });

    console.log(`Deploy Transaction Hash: ${hash}`);
    console.log("Waiting for confirmation...");

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Display deployment results
    console.log("\nDeployment Successful!");
    console.log("=" .repeat(50));
    console.log(`Contract Address: ${receipt.contractAddress}`);
    console.log(`Block Number: ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Effective Gas Price: ${receipt.effectiveGasPrice?.toString() || 'N/A'} wei`);
    
    if (receipt.effectiveGasPrice) {
      const totalCost = receipt.gasUsed * receipt.effectiveGasPrice;
      console.log(`Total Deployment Cost: ${totalCost.toString()} wei`);
    }

    // Provide next steps
    console.log("\n Next Steps:");
    console.log(`Add this to your .env file:`);
    console.log(`TOKEN_ADDRESS=${receipt.contractAddress}`);
    console.log("\n You can now run interaction scripts:");
    console.log("npm run xfer     # Test transfers and approvals");
    console.log("npm run airdrop  # Test batch airdrop");
    console.log("npm run logs     # Query contract events");

  } catch (error) {
    console.error("\n Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment with error handling
main().catch((error) => {
  console.error(" Unexpected error during deployment:");
  console.error(error);
  process.exit(1);
});