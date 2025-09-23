import "dotenv/config";
import { artifacts } from "hardhat";
import {
    createWalletClient,
    createPublicClient,
    http,
    parseUnits,
    getAddress
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

// Environment variables with fallbacks
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").replace(/^0x/, "");
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;

/**
 * Test batch airdrop functionality and compare gas efficiency
 * Demonstrates gas optimization benefits of batch operations
 */
async function main() {
    if (!TOKEN) {
        throw new Error("TOKEN_ADDRESS not set in .env file. Please deploy contract first.");
    }

    console.log("Starting Batch Airdrop Gas Comparison Test");
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

    // Configure test recipients and amounts
    // You can add more addresses here for testing with teammates
    const recipients = [
        getAddress(account.address),    // Self
        getAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"), // Hardhat default account #1
        getAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"), // Hardhat default account #2
        // Add more recipient addresses as needed
    ];

    // Each recipient gets 10 CAMP tokens
    const amounts = recipients.map(() => parseUnits("10", 18));
    const individualAmount = amounts[0];

    console.log(`\nTest Configuration:`);
    console.log(`  Recipients: ${recipients.length}`);
    console.log(`  Amount per recipient: 10 CAMP`);
    console.log(`  Total amount: ${recipients.length * 10} CAMP`);

    try {
        // Test 1: Batch Airdrop
        console.log("\n=== Batch Airdrop Test ===");

        const batchTx = await wallet.writeContract({
            address: TOKEN,
            abi,
            functionName: "airdrop",
            args: [recipients, amounts],
            maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei priority fee
            maxFeePerGas: 22_000_000_000n,        // 22 gwei max fee
        });

        console.log("Batch Airdrop Transaction Hash:", batchTx);
        const batchReceipt = await publicClient.waitForTransactionReceipt({ hash: batchTx });
        const batchGasUsed = batchReceipt.gasUsed;
        const batchGasPrice = batchReceipt.effectiveGasPrice || 0n;
        const batchFee = batchGasUsed * batchGasPrice;

        console.log("Batch Airdrop Results:");
        console.log(`  Gas Used: ${batchGasUsed.toString()}`);
        console.log(`  Gas Price: ${batchGasPrice.toString()} wei`);
        console.log(`  Transaction Fee: ${batchFee.toString()} wei`);

        // Test 2: Individual Transfers (for comparison)
        console.log("\n=== Individual Transfers Test ===");

        let totalIndividualGas = 0n;
        let totalIndividualFee = 0n;
        const individualTxHashes: string[] = [];

        for (let i = 0; i < recipients.length; i++) {
            const transferTx = await wallet.writeContract({
                address: TOKEN,
                abi,
                functionName: "transfer",
                args: [recipients[i], individualAmount],
                maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei priority fee
                maxFeePerGas: 22_000_000_000n,        // 22 gwei max fee
            });

            individualTxHashes.push(transferTx);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: transferTx });

            totalIndividualGas += receipt.gasUsed;
            totalIndividualFee += receipt.gasUsed * (receipt.effectiveGasPrice || 0n);

            console.log(`  Transfer ${i + 1}: ${receipt.gasUsed.toString()} gas`);
        }

        console.log("\nIndividual Transfers Summary:");
        console.log(`  Total Gas Used: ${totalIndividualGas.toString()}`);
        console.log(`  Total Transaction Fee: ${totalIndividualFee.toString()} wei`);

        // Gas Efficiency Analysis
        console.log("\n=== Gas Efficiency Comparison ===");

        if (totalIndividualGas > 0n) {
            const gasRatio = Number(totalIndividualGas - batchGasUsed) / Number(totalIndividualGas) * 100;
            const feeRatio = Number(totalIndividualFee - batchFee) / Number(totalIndividualFee) * 100;

            console.log(`Gas Savings:`);
            console.log(`  Batch Gas: ${batchGasUsed.toString()}`);
            console.log(`  Individual Total Gas: ${totalIndividualGas.toString()}`);
            console.log(`  Gas Saved: ${(totalIndividualGas - batchGasUsed).toString()}`);
            console.log(`  Gas Efficiency: ${gasRatio.toFixed(2)}% savings`);

            console.log(`\nFee Savings:`);
            console.log(`  Batch Fee: ${batchFee.toString()} wei`);
            console.log(`  Individual Total Fee: ${totalIndividualFee.toString()} wei`);
            console.log(`  Fee Saved: ${(totalIndividualFee - batchFee).toString()} wei`);
            console.log(`  Fee Efficiency: ${feeRatio.toFixed(2)}% savings`);

            // Gas optimization explanation
            console.log(`\n=== Why Batch Operations Are Gas-Efficient ===`);
            console.log(`1. Single transaction base cost vs multiple transaction costs`);
            console.log(`2. Reduced calldata overhead (shared function selector)`);
            console.log(`3. Optimized loop execution with unchecked arithmetic`);
            console.log(`4. Pre-validation prevents failed transaction gas waste`);
            console.log(`5. Custom errors reduce gas cost vs require strings`);
        }

    } catch (error) {
        console.error("\nBatch airdrop test failed:");
        console.error(error);
        process.exit(1);
    }
}

// Execute with error handling
main().catch((error) => {
    console.error("Unexpected error during airdrop tests:");
    console.error(error);
    process.exit(1);
});