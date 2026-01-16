#!/usr/bin/env node
// query-processing.js - Query processing records from blockchain via terminal

const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

async function queryProcessingRecords(batchId) {
  let gateway;

  try {
    console.log(`\n🔍 Querying blockchain for batch: ${batchId}\n`);

    // Load connection profile
    const ccpPath = path.resolve(
      __dirname,
      "config",
      "connection-profile.json"
    );

    if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile not found at: ${ccpPath}`);
    }

    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Load wallet
    const walletPath = path.join(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if identity exists
    const identity = await wallet.get("appUser");
    if (!identity) {
      throw new Error(
        'Identity "appUser" not found in wallet. Please enroll the user first.'
      );
    }

    console.log("✅ Wallet loaded");

    // Connect to gateway
    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: false },
    });

    console.log("✅ Connected to gateway");

    // Get network and contract
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("agricultural-contract");

    console.log("✅ Contract loaded\n");

    // Query the batch
    const result = await contract.evaluateTransaction("getBatch", batchId);
    const batch = JSON.parse(result.toString());

    // Display batch info
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log(`📦 BATCH INFORMATION`);
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log(`Batch ID:      ${batch.batchId}`);
    console.log(`Farmer:        ${batch.farmer}`);
    console.log(`Crop:          ${batch.crop}`);
    console.log(`Variety:       ${batch.variety || "N/A"}`);
    console.log(`Quantity:      ${batch.quantity} ${batch.unit || "kg"}`);
    console.log(`Status:        ${batch.status}`);
    console.log(`Location:      ${batch.location}`);
    console.log(`Created:       ${batch.createdDate}`);
    console.log(`Last Updated:  ${batch.lastUpdated}`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );

    // Display processing records
    const processingRecords = batch.processingRecords || [];

    if (processingRecords.length === 0) {
      console.log("ℹ️  No processing records found for this batch.\n");
    } else {
      console.log(
        "═══════════════════════════════════════════════════════════════"
      );
      console.log(
        `🏭 PROCESSING RECORDS (${processingRecords.length} record${
          processingRecords.length > 1 ? "s" : ""
        })`
      );
      console.log(
        "═══════════════════════════════════════════════════════════════\n"
      );

      processingRecords.forEach((record, index) => {
        console.log(`📍 Processing Record #${index + 1}`);
        console.log(
          "───────────────────────────────────────────────────────────────"
        );
        console.log(`  Processor ID:       ${record.processorId}`);
        console.log(`  Processing Type:    ${record.processingType}`);
        console.log(
          `  Location:           ${
            record.processingLocation || "Not specified"
          }`
        );
        console.log(
          `  Coordinates:        ${record.latitude || "N/A"}, ${
            record.longitude || "N/A"
          }`
        );

        if (record.latitude && record.longitude) {
          console.log(
            `  Maps Link:          https://www.google.com/maps?q=${record.latitude},${record.longitude}`
          );
        }

        console.log(`\n  📊 Quantities:`);
        console.log(
          `    Input:            ${record.inputQuantity || "N/A"} ${
            batch.unit || "kg"
          }`
        );
        console.log(
          `    Output:           ${record.outputQuantity || "N/A"} ${
            batch.unit || "kg"
          }`
        );
        console.log(
          `    Waste:            ${record.wasteQuantity || "N/A"} ${
            batch.unit || "kg"
          }`
        );

        if (record.inputQuantity && record.outputQuantity) {
          const efficiency = (
            (record.outputQuantity / record.inputQuantity) *
            100
          ).toFixed(2);
          console.log(`    Efficiency:       ${efficiency}%`);
        }

        console.log(`\n  ⚡ Resources:`);
        console.log(
          `    Processing Time:  ${record.processingTime || "N/A"} minutes`
        );
        console.log(`    Energy Usage:     ${record.energyUsage || "N/A"} kWh`);
        console.log(
          `    Water Usage:      ${record.waterUsage || "N/A"} liters`
        );

        console.log(`\n  🔗 Blockchain:`);
        console.log(`    Processing Date:  ${record.processingDate}`);
        console.log(`    Timestamp:        ${record.timestamp}`);
        console.log(`    Transaction ID:   ${record.txId}`);
        console.log("");
      });

      console.log(
        "═══════════════════════════════════════════════════════════════\n"
      );
    }

    // Display other records if they exist
    if (batch.statusHistory && batch.statusHistory.length > 0) {
      console.log(`📜 Status History: ${batch.statusHistory.length} updates`);
    }
    if (batch.transportRecords && batch.transportRecords.length > 0) {
      console.log(
        `🚚 Transport Records: ${batch.transportRecords.length} records`
      );
    }
    if (batch.qualityTests && batch.qualityTests.length > 0) {
      console.log(`🧪 Quality Tests: ${batch.qualityTests.length} tests`);
    }
    if (batch.financialTransactions && batch.financialTransactions.length > 0) {
      console.log(
        `💰 Financial Transactions: ${batch.financialTransactions.length} transactions`
      );
    }

    console.log("");

    await gateway.disconnect();
    console.log("✅ Query completed successfully\n");

    return batch;
  } catch (error) {
    console.error("\n❌ Error querying blockchain:");

    if (error.message.includes("does not exist")) {
      console.error(`   Batch "${batchId}" not found on blockchain`);
    } else if (error.message.includes("Identity")) {
      console.error(`   ${error.message}`);
    } else if (error.message.includes("Connection profile")) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }

    console.error("");

    if (gateway) {
      try {
        await gateway.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }

    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const batchId = process.argv[2];

  if (!batchId) {
    console.error("\n❌ Error: Batch ID is required\n");
    console.log("Usage: node query-processing.js <BATCH_ID>\n");
    console.log("Example: node query-processing.js PALM001\n");
    process.exit(1);
  }

  queryProcessingRecords(batchId);
}

module.exports = { queryProcessingRecords };
