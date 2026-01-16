#!/usr/bin/env node
// blockchain-query-cli.js - CLI tool for querying blockchain data

const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

class BlockchainQuery {
  constructor() {
    this.gateway = null;
    this.contract = null;
  }

  async connect() {
    try {
      const ccpPath = path.resolve(
        __dirname,
        "config",
        "connection-profile.json"
      );
      const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

      const walletPath = path.join(__dirname, "wallet");
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      const identity = await wallet.get("appUser");
      if (!identity) {
        throw new Error('Identity "appUser" not found in wallet');
      }

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: false },
      });

      const network = await this.gateway.getNetwork("mychannel");
      this.contract = network.getContract("agricultural-contract");

      return true;
    } catch (error) {
      throw error;
    }
  }

  async disconnect() {
    if (this.gateway) {
      await this.gateway.disconnect();
    }
  }

  async getBatch(batchId) {
    const result = await this.contract.evaluateTransaction("getBatch", batchId);
    return JSON.parse(result.toString());
  }

  async getAllBatches(filters = {}) {
    const result = await this.contract.evaluateTransaction(
      "getAllBatches",
      JSON.stringify(filters)
    );
    return JSON.parse(result.toString());
  }

  async getBatchHistory(batchId) {
    const result = await this.contract.evaluateTransaction(
      "getBatchHistory",
      batchId
    );
    return JSON.parse(result.toString());
  }

  async getPricingHistory(batchId) {
    const result = await this.contract.evaluateTransaction(
      "getPricingHistory",
      batchId
    );
    return JSON.parse(result.toString());
  }

  async getTransportHistory(batchId) {
    const result = await this.contract.evaluateTransaction(
      "getTransportHistory",
      batchId
    );
    return JSON.parse(result.toString());
  }
}

// Display processing records
function displayProcessingRecords(records, unit = "kg", format = "table") {
  if (format === "json") {
    console.log(JSON.stringify(records, null, 2));
    return;
  }

  if (!records || records.length === 0) {
    console.log(
      `${colors.yellow}ℹ️  No processing records found${colors.reset}\n`
    );
    return;
  }

  console.log(
    `\n${colors.bright}${colors.cyan}Processing Records: ${records.length}${colors.reset}\n`
  );

  records.forEach((record, index) => {
    console.log(`${colors.bright}Record #${index + 1}${colors.reset}`);
    console.log("─".repeat(70));
    console.log(`Processor:        ${record.processorId}`);
    console.log(`Type:             ${record.processingType}`);
    console.log(`Location:         ${record.processingLocation || "N/A"}`);

    if (record.latitude && record.longitude) {
      console.log(`Coordinates:      ${record.latitude}, ${record.longitude}`);
      console.log(
        `Google Maps:      https://maps.google.com/?q=${record.latitude},${record.longitude}`
      );
    }

    console.log(`\n${colors.cyan}Quantities:${colors.reset}`);
    console.log(`  Input:          ${record.inputQuantity || "N/A"} ${unit}`);
    console.log(`  Output:         ${record.outputQuantity || "N/A"} ${unit}`);
    console.log(`  Waste:          ${record.wasteQuantity || "N/A"} ${unit}`);

    if (record.inputQuantity && record.outputQuantity) {
      const efficiency = (
        (record.outputQuantity / record.inputQuantity) *
        100
      ).toFixed(2);
      console.log(
        `  Efficiency:     ${colors.green}${efficiency}%${colors.reset}`
      );
    }

    console.log(`\n${colors.cyan}Resources:${colors.reset}`);
    console.log(`  Time:           ${record.processingTime || "N/A"} min`);
    console.log(`  Energy:         ${record.energyUsage || "N/A"} kWh`);
    console.log(`  Water:          ${record.waterUsage || "N/A"} L`);

    console.log(`\n${colors.cyan}Blockchain:${colors.reset}`);
    console.log(`  Date:           ${record.processingDate}`);
    console.log(`  Timestamp:      ${record.timestamp}`);
    console.log(`  TX ID:          ${record.txId}`);
    console.log("");
  });
}

// Command handlers
async function handleGetBatch(batchId, options) {
  const query = new BlockchainQuery();

  try {
    await query.connect();
    const batch = await query.getBatch(batchId);

    if (options.json) {
      console.log(JSON.stringify(batch, null, 2));
    } else {
      console.log(
        `\n${colors.bright}${colors.blue}BATCH: ${batch.batchId}${colors.reset}`
      );
      console.log("═".repeat(70));
      console.log(`Farmer:           ${batch.farmer}`);
      console.log(
        `Crop:             ${batch.crop} ${
          batch.variety ? `(${batch.variety})` : ""
        }`
      );
      console.log(`Quantity:         ${batch.quantity} ${batch.unit || "kg"}`);
      console.log(
        `Status:           ${colors.green}${batch.status}${colors.reset}`
      );
      console.log(`Location:         ${batch.location}`);

      if (batch.coordinates) {
        console.log(
          `Coordinates:      ${batch.coordinates.latitude}, ${batch.coordinates.longitude}`
        );
      }

      console.log(`Created:          ${batch.createdDate}`);
      console.log(`Last Updated:     ${batch.lastUpdated}`);

      if (options.processing) {
        displayProcessingRecords(batch.processingRecords, batch.unit);
      } else if (
        batch.processingRecords &&
        batch.processingRecords.length > 0
      ) {
        console.log(
          `\n${colors.yellow}💡 Tip: Use --processing flag to see processing records${colors.reset}`
        );
      }

      console.log("");
    }

    await query.disconnect();
  } catch (error) {
    await query.disconnect();
    throw error;
  }
}

async function handleGetProcessing(batchId, options) {
  const query = new BlockchainQuery();

  try {
    await query.connect();
    const batch = await query.getBatch(batchId);

    displayProcessingRecords(
      batch.processingRecords,
      batch.unit,
      options.json ? "json" : "table"
    );

    await query.disconnect();
  } catch (error) {
    await query.disconnect();
    throw error;
  }
}

async function handleListBatches(options) {
  const query = new BlockchainQuery();

  try {
    await query.connect();

    const filters = {};
    if (options.status) filters.status = options.status;
    if (options.farmer) filters.farmer = options.farmer;
    if (options.crop) filters.crop = options.crop;

    const batches = await query.getAllBatches(filters);

    if (options.json) {
      console.log(JSON.stringify(batches, null, 2));
    } else {
      console.log(
        `\n${colors.bright}${colors.blue}BATCHES FOUND: ${batches.length}${colors.reset}\n`
      );

      batches.forEach((batch, index) => {
        console.log(
          `${index + 1}. ${colors.bright}${batch.batchId}${colors.reset}`
        );
        console.log(`   Farmer: ${batch.farmer}`);
        console.log(
          `   Crop: ${batch.crop} | Qty: ${batch.quantity} ${
            batch.unit || "kg"
          }`
        );
        console.log(`   Status: ${colors.green}${batch.status}${colors.reset}`);
        console.log(
          `   Processing Records: ${batch.processingRecords?.length || 0}`
        );
        console.log("");
      });
    }

    await query.disconnect();
  } catch (error) {
    await query.disconnect();
    throw error;
  }
}

async function handleHistory(batchId, options) {
  const query = new BlockchainQuery();

  try {
    await query.connect();
    const history = await query.getBatchHistory(batchId);

    if (options.json) {
      console.log(JSON.stringify(history, null, 2));
    } else {
      console.log(
        `\n${colors.bright}${colors.blue}BATCH HISTORY: ${batchId}${colors.reset}`
      );
      console.log("═".repeat(70));
      console.log(
        `Current Status:     ${colors.green}${history.currentStatus}${colors.reset}`
      );
      console.log(`Total Events:       ${history.totalEvents}`);
      console.log(`Status Changes:     ${history.statusHistory.length}`);
      console.log(`Processing Steps:   ${history.processingHistory.length}`);
      console.log(`Transport Steps:    ${history.transportHistory.length}`);
      console.log(`Quality Tests:      ${history.qualityTestHistory.length}`);
      console.log(`Transactions:       ${history.financialHistory.length}`);

      if (options.processing && history.processingHistory.length > 0) {
        displayProcessingRecords(history.processingHistory);
      }

      console.log("");
    }

    await query.disconnect();
  } catch (error) {
    await query.disconnect();
    throw error;
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
${colors.bright}${colors.blue}Blockchain Query CLI${colors.reset}

${colors.bright}USAGE:${colors.reset}
  node blockchain-query-cli.js <command> [options]

${colors.bright}COMMANDS:${colors.reset}
  ${colors.green}batch${colors.reset} <batchId>              Get batch information
  ${colors.green}processing${colors.reset} <batchId>         Get processing records for a batch
  ${colors.green}history${colors.reset} <batchId>            Get complete batch history
  ${colors.green}list${colors.reset}                         List all batches

${colors.bright}OPTIONS:${colors.reset}
  --json                       Output in JSON format
  --processing                 Include processing records
  --status <status>            Filter by status
  --farmer <name>              Filter by farmer name
  --crop <crop>                Filter by crop

${colors.bright}EXAMPLES:${colors.reset}
  node blockchain-query-cli.js batch PALM001
  node blockchain-query-cli.js batch PALM001 --processing
  node blockchain-query-cli.js processing PALM001
  node blockchain-query-cli.js processing PALM001 --json
  node blockchain-query-cli.js history PALM001
  node blockchain-query-cli.js list
  node blockchain-query-cli.js list --status PROCESSING
  node blockchain-query-cli.js list --farmer "Green Valley Farm"
  node blockchain-query-cli.js list --json
`);
    process.exit(0);
  }

  const command = args[0];
  const batchId = args[1];

  const options = {
    json: args.includes("--json"),
    processing: args.includes("--processing"),
    status: args.includes("--status")
      ? args[args.indexOf("--status") + 1]
      : null,
    farmer: args.includes("--farmer")
      ? args[args.indexOf("--farmer") + 1]
      : null,
    crop: args.includes("--crop") ? args[args.indexOf("--crop") + 1] : null,
  };

  try {
    switch (command) {
      case "batch":
        if (!batchId) {
          console.error(
            `${colors.red}❌ Error: Batch ID required${colors.reset}\n`
          );
          process.exit(1);
        }
        await handleGetBatch(batchId, options);
        break;

      case "processing":
        if (!batchId) {
          console.error(
            `${colors.red}❌ Error: Batch ID required${colors.reset}\n`
          );
          process.exit(1);
        }
        await handleGetProcessing(batchId, options);
        break;

      case "history":
        if (!batchId) {
          console.error(
            `${colors.red}❌ Error: Batch ID required${colors.reset}\n`
          );
          process.exit(1);
        }
        await handleHistory(batchId, options);
        break;

      case "list":
        await handleListBatches(options);
        break;

      default:
        console.error(
          `${colors.red}❌ Unknown command: ${command}${colors.reset}\n`
        );
        console.log(`Run with --help to see available commands\n`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BlockchainQuery };
