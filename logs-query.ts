import "dotenv/config";
import { artifacts } from "hardhat";
import {
    createPublicClient,
    http,
    decodeEventLog,
    formatUnits
} from "viem";
import { hardhat } from "viem/chains";

// Environment variables
const TOKEN = process.env.TOKEN_ADDRESS as `0x${string}`;

/**
 * Query and display contract events (Transfer, Approval, etc.)
 * Demonstrates event monitoring and log analysis
 */
async function main() {
    if (!TOKEN) {
        throw new Error("TOKEN_ADDRESS not set in .env file. Please deploy contract first.");
    }

    console.log("Starting Contract Event Query");
    console.log("Contract Address:", TOKEN);

    // Load contract artifacts
    const { abi } = await artifacts.readArtifact("CampusCredit");

    // Setup public client for reading blockchain data
    const publicClient = createPublicClient({
        chain: hardhat,
        transport: http()
    });

    try {
        // Get current block number
        const latestBlock = await publicClient.getBlockNumber();
        console.log("Latest Block Number:", latestBlock.toString());

        // Define block range for event query
        // Query last 2000 blocks or from genesis if fewer blocks exist
        const fromBlock = latestBlock > 2000n ? latestBlock - 2000n : 0n;
        const toBlock = "latest" as const;

        console.log(`\nQuerying events from block ${fromBlock.toString()} to latest...`);

        // Query all logs from the contract
        const logs = await publicClient.getLogs({
            address: TOKEN,
            fromBlock,
            toBlock
        });

        if (logs.length === 0) {
            console.log("No events found. Make sure you have executed some transactions.");
            return;
        }

        console.log(`Found ${logs.length} events:\n`);

        // Process and display each event
        for (const log of logs) {
            try {
                // Decode the event log using the contract ABI
                const decodedLog = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics
                });

                const blockInfo = `Block ${log.blockNumber?.toString() || 'unknown'}`;
                const txHash = log.transactionHash?.slice(0, 10) || 'unknown';

                console.log(`[${blockInfo}] ${decodedLog.eventName} (tx: ${txHash}...)`);

                // Format event data based on event type
                switch (decodedLog.eventName) {
                    case 'Transfer':
                        const transfer = decodedLog.args as {
                            from: `0x${string}`;
                            to: `0x${string}`;
                            value: bigint;
                        };
                        console.log(`  From: ${transfer.from}`);
                        console.log(`  To: ${transfer.to}`);
                        console.log(`  Amount: ${formatUnits(transfer.value, 18)} CAMP`);
                        break;

                    case 'Approval':
                        const approval = decodedLog.args as {
                            owner: `0x${string}`;
                            spender: `0x${string}`;
                            value: bigint;
                        };
                        console.log(`  Owner: ${approval.owner}`);
                        console.log(`  Spender: ${approval.spender}`);
                        console.log(`  Amount: ${formatUnits(approval.value, 18)} CAMP`);
                        break;

                    case 'RoleGranted':
                        const roleGranted = decodedLog.args as {
                            role: `0x${string}`;
                            account: `0x${string}`;
                            sender: `0x${string}`;
                        };
                        console.log(`  Role: ${roleGranted.role}`);
                        console.log(`  Account: ${roleGranted.account}`);
                        console.log(`  Granted by: ${roleGranted.sender}`);
                        break;

                    case 'Paused':
                        const paused = decodedLog.args as {
                            account: `0x${string}`;
                        };
                        console.log(`  Paused by: ${paused.account}`);
                        break;

                    case 'Unpaused':
                        const unpaused = decodedLog.args as {
                            account: `0x${string}`;
                        };
                        console.log(`  Unpaused by: ${unpaused.account}`);
                        break;

                    default:
                        // Handle other events generically
                        console.log(`  Args:`, decodedLog.args);
                        break;
                }

                console.log(); // Add blank line between events

            } catch (decodeError) {
                // Skip events that can't be decoded (might be from other contracts)
                console.log(`[Block ${log.blockNumber?.toString()}] Unable to decode event`);
                console.log(`  Transaction: ${log.transactionHash}`);
                console.log(`  Topics: ${log.topics?.[0] || 'unknown'}`);
                console.log();
            }
        }

        // Provide event summary
        const eventCounts: Record<string, number> = {};
        let successfulDecodes = 0;

        for (const log of logs) {
            try {
                const decodedLog = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics
                });
                eventCounts[decodedLog.eventName] = (eventCounts[decodedLog.eventName] || 0) + 1;
                successfulDecodes++;
            } catch {
                // Count failed decodes
                eventCounts['Unknown/External'] = (eventCounts['Unknown/External'] || 0) + 1;
            }
        }

        console.log("Event Summary:");
        console.log(`  Total Events: ${logs.length}`);
        console.log(`  Successfully Decoded: ${successfulDecodes}`);

        for (const [eventName, count] of Object.entries(eventCounts)) {
            console.log(`  ${eventName}: ${count}`);
        }

        // Additional contract state information
        console.log("\nCurrent Contract State:");

        const totalSupply = await publicClient.readContract({
            address: TOKEN,
            abi,
            functionName: "totalSupply",
            args: []
        }) as bigint;

        const cap = await publicClient.readContract({
            address: TOKEN,
            abi,
            functionName: "cap",
            args: []
        }) as bigint;

        const paused = await publicClient.readContract({
            address: TOKEN,
            abi,
            functionName: "paused",
            args: []
        }) as boolean;

        console.log(`  Total Supply: ${formatUnits(totalSupply, 18)} CAMP`);
        console.log(`  Token Cap: ${formatUnits(cap, 18)} CAMP`);
        console.log(`  Paused: ${paused ? 'Yes' : 'No'}`);
        console.log(`  Supply Utilization: ${(Number(totalSupply) / Number(cap) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error("\nEvent query failed:");
        console.error(error);
        process.exit(1);
    }
}

// Execute with error handling
main().catch((error) => {
    console.error("Unexpected error during event query:");
    console.error(error);
    process.exit(1);
});