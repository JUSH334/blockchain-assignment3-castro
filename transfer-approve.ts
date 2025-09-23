import "dotenv/config";
import { artifacts } from "hardhat";
import {
    createWalletClient,
    createPublicClient,
    http,
    parseUnits,
    formatUnits,
    getAddress
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

// Environment variables with fallbacks for local development
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").replace(/^0x/, "");
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;
const RECIPIENT = process.env.RECIPIENT || ""; // Optional teammate address

/**
 * Test transfer and approve operations
 * Demonstrates basic ERC-20 functionality with gas reporting
 */
async function main() {
    if (!TOKEN) {
        throw new Error("TOKEN_ADDRESS not set in .env file. Please deploy contract first.");
    }

    console.log("Starting Transfer and Approve Tests");
    console.log("Contract Address:", TOKEN);

    // Load contract artifacts
    const { abi } = await artifacts.readArtifact("CampusCredit");

    // Setup account and clients
    const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
    const wallet = createWalletClient({
        account,
        chain: hardhat,
        transport: http()
    });
    const publicClient = createPublicClient({
        chain: hardhat,
        transport: http()
    });

    const myAddress = getAddress(account.address);
    const recipientAddress = RECIPIENT ? getAddress(RECIPIENT) : myAddress; // Self-transfer if no recipient

    console.log("Deployer Address:", myAddress);
    console.log("Recipient Address:", recipientAddress);

    /**
     * Helper function to display token balances
     */
    const displayBalances = async (label: string) => {
        const myBalance = await publicClient.readContract({
            address: TOKEN,
            abi,
            functionName: "balanceOf",
            args: [myAddress]
        }) as bigint;

        const recipientBalance = await publicClient.readContract({
            address: TOKEN,
            abi,
            functionName: "balanceOf",
            args: [recipientAddress]
        }) as bigint;

        console.log(`\n${label} Balances:`);
        console.log(`  My Balance: ${formatUnits(myBalance, 18)} CAMP`);
        console.log(`  Recipient Balance: ${formatUnits(recipientBalance, 18)} CAMP`);
    };

    try {
        // Display initial balances
        await displayBalances("Initial");

        // Test 1: Transfer 100 CAMP tokens
        console.log("\nExecuting transfer of 100 CAMP tokens...");
        const transferAmount = parseUnits("100", 18);

        const transferTx = await wallet.writeContract({
            address: TOKEN,
            abi,
            functionName: "transfer",
            args: [recipientAddress, transferAmount],
            maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei priority fee
            maxFeePerGas: 20_000_000_000n,        // 20 gwei max fee
        });

        console.log("Transfer Transaction Hash:", transferTx);
        const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTx });
        console.log("Transfer Gas Used:", transferReceipt.gasUsed.toString());

        // Test 2: Approve 50 CAMP tokens
        console.log("\nExecuting approval of 50 CAMP tokens...");
        const approveAmount = parseUnits("50", 18);

        const approveTx = await wallet.writeContract({
            address: TOKEN,
            abi,
            functionName: "approve",
            args: [recipientAddress, approveAmount],
            maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei priority fee
            maxFeePerGas: 21_000_000_000n,        // 21 gwei max fee
        });

        console.log("Approve Transaction Hash:", approveTx);
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log("Approve Gas Used:", approveReceipt.gasUsed.toString());

        // Check allowance
        const allowance = await publicClient.readContract({
            address: TOKEN,
            abi,
            functionName: "allowance",
            args: [myAddress, recipientAddress]
        }) as bigint;

        console.log(`\nAllowance Set: ${formatUnits(allowance, 18)} CAMP`);

        // Display final balances
        await displayBalances("Final");

        // Calculate total gas costs
        const totalGasUsed = transferReceipt.gasUsed + approveReceipt.gasUsed;
        const avgGasPrice = ((transferReceipt.effectiveGasPrice || 0n) + (approveReceipt.effectiveGasPrice || 0n)) / 2n;
        const totalCost = totalGasUsed * avgGasPrice;

        console.log("\nTransaction Summary:");
        console.log("  Total Gas Used:", totalGasUsed.toString());
        console.log("  Average Gas Price:", avgGasPrice.toString(), "wei");
        console.log("  Total Cost:", totalCost.toString(), "wei");

    } catch (error) {
        console.error("\nTransfer/Approve test failed:");
        console.error(error);
        process.exit(1);
    }
}

// Execute with error handling
main().catch((error) => {
    console.error("Unexpected error during transfer/approve tests:");
    console.error(error);
    process.exit(1);
});