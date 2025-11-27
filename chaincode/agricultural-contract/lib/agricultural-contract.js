"use strict";

const { Contract } = require("fabric-contract-api");

class AgriculturalContract extends Contract {
    
    async initLedger(ctx) {
        console.info("============= START : Initialize Agricultural Ledger ===========");
        
        // Initialize with sample data that matches database schema
        const sampleBatches = [
            {
                batchId: "PALM001",
                farmer: "Green Valley Farm",
                crop: "Palm Oil",
                variety: "Tenera",
                quantity: 5000,
                unit: "kg",
                location: "Selangor, Malaysia",
                coordinates: {
                    latitude: 3.0738,
                    longitude: 101.5183
                },
                status: "REGISTERED",
                docType: "batch",
                dataHash: "",
                createdDate: ctx.stub.getTxTimestamp().seconds.low + "." + ctx.stub.getTxTimestamp().nanos,
                lastUpdated: ctx.stub.getTxTimestamp().seconds.low + "." + ctx.stub.getTxTimestamp().nanos,
                statusHistory: []
            }
        ];

        for (let batch of sampleBatches) {
            await ctx.stub.putState(batch.batchId, Buffer.from(JSON.stringify(batch)));
            console.info(`Added sample batch: ${batch.batchId}`);
        }
        
        console.info("============= END : Initialize Agricultural Ledger ===========");
    }

    // Enhanced batch creation with comprehensive data
    async createBatch(ctx, batchId, farmer, crop, quantity, location, additionalData) {
        console.info(`============= START : Create Batch ${batchId} ===========`);

        // Check if batch already exists
        const batchExists = await ctx.stub.getState(batchId);
        if (batchExists && batchExists.length > 0) {
            throw new Error(`Batch ${batchId} already exists`);
        }

        // Validate required data
        const validationErrors = await this.validateBatchData(farmer, crop, quantity, location);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
        }

        // Parse additional data from database (handle undefined/null)
        let extraData = {};
        try {
            if (additionalData && additionalData !== '') {
                extraData = typeof additionalData === 'string' ? JSON.parse(additionalData) : additionalData;
            }
        } catch (error) {
            console.warn('Invalid additional data provided, using defaults');
        }

        // Get transaction details
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();
        const mspId = ctx.clientIdentity.getMSPID();

        // Create comprehensive batch record
        const batch = {
            batchId: batchId,
            farmer: farmer,
            crop: crop,
            variety: extraData.variety || null,
            quantity: parseFloat(quantity),
            unit: extraData.unit || 'kg',
            location: location,
            coordinates: extraData.coordinates || null,
            harvestDate: extraData.harvestDate || null,
            cultivationMethod: extraData.cultivationMethod || null,
            qualityGrade: extraData.qualityGrade || null,
            certifications: extraData.certifications || [],
            customCertification: extraData.customCertification || null,

            // Pricing Information (Farm-gate level)
            pricePerUnit: extraData.pricePerUnit ? parseFloat(extraData.pricePerUnit) : null,
            currency: extraData.currency || 'MYR',
            totalBatchValue: extraData.totalBatchValue ? parseFloat(extraData.totalBatchValue) : null,
            paymentMethod: extraData.paymentMethod || null,
            buyerName: extraData.buyerName || null,

            status: 'REGISTERED',
            docType: 'batch',
            
            // Blockchain specific data
            txId: txId,
            mspId: mspId,
            createdDate: timestamp.seconds.low + "." + timestamp.nanos,
            lastUpdated: timestamp.seconds.low + "." + timestamp.nanos,
            
            // Database integration
            dataHash: extraData.dataHash || '',
            databaseId: extraData.databaseId || null,
            
            // Supply chain tracking
            statusHistory: [
                {
                    status: 'REGISTERED',
                    updatedBy: farmer,
                    timestamp: timestamp.seconds.low + "." + timestamp.nanos,
                    previousStatus: null,
                    txId: txId,
                    notes: 'Initial batch registration'
                }
            ],
            
            // Processing tracking
            processingRecords: [],
            transportRecords: [],
            qualityTests: [],
            financialTransactions: [],
            
            // Compliance and regulatory
            complianceChecks: [],
            exportImportData: null,
            
            // Weather and environmental data
            environmentalData: extraData.environmentalData || null
        };

        // Store on blockchain
        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        
        // Emit event for database synchronization
        ctx.stub.setEvent('BatchCreated', Buffer.from(JSON.stringify({
            batchId: batchId,
            farmer: farmer,
            crop: crop,
            timestamp: batch.createdDate,
            txId: txId
        })));

        console.info(`============= END : Create Batch ${batchId} ===========`);
        return JSON.stringify(batch);
    }

    // Get batch with comprehensive data
    async getBatch(ctx, batchId) {
        console.info(`Getting batch: ${batchId}`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());

        // Note: Do not add non-deterministic data here as this function
        // is used in both queries and transactions. Non-deterministic data
        // like timestamps will cause endorsement mismatches.

        return JSON.stringify(batch);
    }

    // Check if batch exists
    async batchExists(ctx, batchId) {
        const batchJSON = await ctx.stub.getState(batchId);
        return batchJSON && batchJSON.length > 0;
    }

    // Enhanced status update with processing records
    async updateBatchStatus(ctx, batchId, status, updatedBy, timestamp, additionalData) {
        console.info(`============= START : Update Batch Status ${batchId} ===========`);
        
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`The batch ${batchId} does not exist`);
        }

        const batch = await this.getBatch(ctx, batchId);
        const batchData = JSON.parse(batch);
        const txId = ctx.stub.getTxID();

        // Parse additional data
        let extraData = {};
        try {
            if (additionalData && additionalData !== "") {
                extraData = typeof additionalData === 'string' ? JSON.parse(additionalData) : additionalData;
            }
        } catch (error) {
            console.warn('Invalid additional data in status update');
        }

        // Initialize arrays if they don't exist
        if (!batchData.statusHistory) batchData.statusHistory = [];

        // Add status update to history
        const statusUpdate = {
            status: status,
            updatedBy: updatedBy,
            timestamp: timestamp,
            previousStatus: batchData.status || "REGISTERED",
            txId: txId,
            notes: extraData.notes || '',
            location: extraData.location || null,
            weatherData: extraData.weatherData || null
        };

        batchData.statusHistory.push(statusUpdate);
        batchData.status = status;
        batchData.lastUpdated = timestamp;
        batchData.lastUpdatedBy = updatedBy;

        // Update specific records based on status
        switch (status.toUpperCase()) {
            case 'PROCESSING':
                if (extraData.processingData) {
                    if (!batchData.processingRecords) batchData.processingRecords = [];
                    batchData.processingRecords.push({
                        ...extraData.processingData,
                        timestamp: timestamp,
                        txId: txId
                    });
                }
                break;
                
            case 'IN_TRANSIT':
                if (extraData.transportData) {
                    if (!batchData.transportRecords) batchData.transportRecords = [];
                    batchData.transportRecords.push({
                        ...extraData.transportData,
                        timestamp: timestamp,
                        txId: txId
                    });
                }
                break;
                
            case 'QUALITY_TESTED':
                if (extraData.qualityData) {
                    if (!batchData.qualityTests) batchData.qualityTests = [];
                    batchData.qualityTests.push({
                        ...extraData.qualityData,
                        timestamp: timestamp,
                        txId: txId
                    });
                }
                break;
        }

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        // Emit event for database synchronization
        ctx.stub.setEvent('BatchStatusUpdated', Buffer.from(JSON.stringify({
            batchId: batchId,
            newStatus: status,
            previousStatus: statusUpdate.previousStatus,
            updatedBy: updatedBy,
            timestamp: timestamp,
            txId: txId
        })));

        console.info(`============= END : Update Batch Status ${batchId} ===========`);
        return JSON.stringify(batchData);
    }

    // Add processing record
    async addProcessingRecord(ctx, batchId, processorId, processingType, processingData) {
        console.info(`============= START : Add Processing Record ${batchId} ===========`);
        
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`The batch ${batchId} does not exist`);
        }

        const batch = await this.getBatch(ctx, batchId);
        const batchData = JSON.parse(batch);
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();

        // Initialize processing records if not exists
        if (!batchData.processingRecords) {
            batchData.processingRecords = [];
        }

        // Parse processing data
        let processData = {};
        try {
            processData = typeof processingData === 'string' ? JSON.parse(processingData) : processingData;
        } catch (error) {
            console.warn('Invalid processing data provided');
        }

        const processingRecord = {
            processorId: processorId,
            processingType: processingType,
            timestamp: timestamp.seconds.low + "." + timestamp.nanos,
            txId: txId,
            inputQuantity: processData.inputQuantity || batchData.quantity,
            outputQuantity: processData.outputQuantity || null,
            processingMethod: processData.processingMethod || null,
            facilityLocation: processData.facilityLocation || null,
            qualityParameters: processData.qualityParameters || null,
            byproducts: processData.byproducts || [],
            waste: processData.waste || null,
            energyUsed: processData.energyUsed || null,
            certifications: processData.certifications || []
        };

        batchData.processingRecords.push(processingRecord);
        batchData.lastUpdated = timestamp.seconds.low + "." + timestamp.nanos;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        // Emit event
        ctx.stub.setEvent('ProcessingRecordAdded', Buffer.from(JSON.stringify({
            batchId: batchId,
            processorId: processorId,
            processingType: processingType,
            timestamp: processingRecord.timestamp,
            txId: txId
        })));

        console.info(`============= END : Add Processing Record ${batchId} ===========`);
        return JSON.stringify(processingRecord);
    }

    // Add financial transaction
    async addFinancialTransaction(ctx, batchId, transactionType, amount, currency, payerPayee, transactionData) {
        console.info(`============= START : Add Financial Transaction ${batchId} ===========`);
        
        const exists = await this.batchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`The batch ${batchId} does not exist`);
        }

        const batch = await this.getBatch(ctx, batchId);
        const batchData = JSON.parse(batch);
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();

        if (!batchData.financialTransactions) {
            batchData.financialTransactions = [];
        }

        // Parse transaction data
        let txData = {};
        try {
            txData = typeof transactionData === 'string' ? JSON.parse(transactionData) : transactionData;
        } catch (error) {
            console.warn('Invalid transaction data provided');
        }

        const financialTransaction = {
            transactionType: transactionType, // SALE, PURCHASE, PROCESSING_FEE, TRANSPORT_FEE, etc.
            amount: parseFloat(amount),
            currency: currency,
            payerPayee: payerPayee,
            timestamp: timestamp.seconds.low + "." + timestamp.nanos,
            txId: txId,
            description: txData.description || '',
            paymentMethod: txData.paymentMethod || null,
            invoiceNumber: txData.invoiceNumber || null,
            taxes: txData.taxes || null,
            exchangeRate: txData.exchangeRate || null
        };

        batchData.financialTransactions.push(financialTransaction);
        batchData.lastUpdated = timestamp.seconds.low + "." + timestamp.nanos;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        // Emit event
        ctx.stub.setEvent('FinancialTransactionAdded', Buffer.from(JSON.stringify({
            batchId: batchId,
            transactionType: transactionType,
            amount: amount,
            currency: currency,
            timestamp: financialTransaction.timestamp,
            txId: txId
        })));

        console.info(`============= END : Add Financial Transaction ${batchId} ===========`);
        return JSON.stringify(financialTransaction);
    }

    // Add pricing record for supply chain transparency
    async addPricingRecord(ctx, batchId, pricingData) {
        console.info(`============= START : Add Pricing Record ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();

        // Parse pricing data
        const pricing = typeof pricingData === 'string' ? JSON.parse(pricingData) : pricingData;

        // Initialize pricing history if not exists
        if (!batch.pricingHistory) {
            batch.pricingHistory = [];
        }

        // Create pricing record
        const pricingRecord = {
            level: pricing.level, // FARMER, PROCESSOR, DISTRIBUTOR, RETAILER
            timestamp: timestamp.seconds.low + "." + timestamp.nanos,
            actorName: pricing.actorName || '',
            actorId: pricing.actorId || '',
            pricePerUnit: parseFloat(pricing.pricePerUnit),
            totalValue: parseFloat(pricing.totalValue),
            quantity: pricing.quantity ? parseFloat(pricing.quantity) : batch.quantity,
            unit: pricing.unit || batch.unit || 'kg',
            currency: pricing.currency || 'MYR',
            breakdown: pricing.breakdown || {},
            notes: pricing.notes || '',
            txId: txId,
            metadata: pricing.metadata || {}
        };

        // Add to pricing history
        batch.pricingHistory.push(pricingRecord);
        batch.lastUpdated = timestamp.seconds.low + "." + timestamp.nanos;

        // Update current price to latest
        batch.currentPricePerUnit = pricingRecord.pricePerUnit;
        batch.currentTotalValue = pricingRecord.totalValue;
        batch.currentLevel = pricingRecord.level;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        // Emit event for database synchronization
        ctx.stub.setEvent('PricingRecordAdded', Buffer.from(JSON.stringify({
            batchId: batchId,
            level: pricing.level,
            pricePerUnit: pricingRecord.pricePerUnit,
            totalValue: pricingRecord.totalValue,
            timestamp: pricingRecord.timestamp,
            txId: txId
        })));

        console.info(`============= END : Add Pricing Record ${batchId} ===========`);
        return JSON.stringify(pricingRecord);
    }

    // Get pricing history for a batch
    async getPricingHistory(ctx, batchId) {
        console.info(`============= START : Get Pricing History ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());

        // Calculate price increase if history exists
        let priceIncrease = null;
        if (batch.pricingHistory && batch.pricingHistory.length >= 2) {
            const farmPrice = batch.pricingHistory.find(p => p.level === 'FARMER')?.pricePerUnit || 0;
            const currentPrice = batch.pricingHistory[batch.pricingHistory.length - 1].pricePerUnit;

            if (farmPrice > 0) {
                const increase = currentPrice - farmPrice;
                const percentageIncrease = (increase / farmPrice) * 100;

                priceIncrease = {
                    absoluteIncrease: increase,
                    percentageIncrease: percentageIncrease.toFixed(2),
                    farmPrice: farmPrice,
                    currentPrice: currentPrice
                };
            }
        }

        const result = {
            batchId: batchId,
            currentPrice: {
                pricePerUnit: batch.currentPricePerUnit || null,
                totalValue: batch.currentTotalValue || null,
                level: batch.currentLevel || null,
                currency: batch.currency || 'MYR'
            },
            pricingHistory: batch.pricingHistory || [],
            priceIncrease: priceIncrease,
            totalLevels: batch.pricingHistory ? batch.pricingHistory.length : 0
        };

        console.info(`============= END : Get Pricing History ${batchId} ===========`);
        return JSON.stringify(result);
    }

    // Calculate price markup at each level
    async calculatePriceMarkup(ctx, batchId) {
        console.info(`============= START : Calculate Price Markup ${batchId} ===========`);

        const historyResult = await this.getPricingHistory(ctx, batchId);
        const history = JSON.parse(historyResult);

        if (!history.pricingHistory || history.pricingHistory.length === 0) {
            return JSON.stringify({ message: 'No pricing history available' });
        }

        const markups = [];
        for (let i = 1; i < history.pricingHistory.length; i++) {
            const previous = history.pricingHistory[i - 1];
            const current = history.pricingHistory[i];

            const markup = current.pricePerUnit - previous.pricePerUnit;
            const markupPercentage = (markup / previous.pricePerUnit) * 100;

            markups.push({
                fromLevel: previous.level,
                toLevel: current.level,
                previousPrice: previous.pricePerUnit,
                currentPrice: current.pricePerUnit,
                markup: markup,
                markupPercentage: markupPercentage.toFixed(2),
                currency: current.currency
            });
        }

        console.info(`============= END : Calculate Price Markup ${batchId} ===========`);
        return JSON.stringify({
            batchId: batchId,
            markups: markups,
            totalMarkup: markups.reduce((sum, m) => sum + m.markup, 0),
            averageMarkupPercentage: (markups.reduce((sum, m) => sum + parseFloat(m.markupPercentage), 0) / markups.length).toFixed(2)
        });
    }

    // Enhanced verification with comprehensive checks
    async verifyBatch(ctx, batchId) {
        console.info(`============= START : Verify Batch ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        const verificationTimestamp = ctx.stub.getTxTimestamp();

        // Comprehensive verification data
        const verification = {
            ...batch, // Include all batch data
            verified: true,
            verificationTime: verificationTimestamp.seconds.low + "." + verificationTimestamp.nanos,
            verificationTxId: ctx.stub.getTxID(),
            
            blockchainProof: {
                network: "mychannel",
                organization: ctx.clientIdentity.getMSPID(),
                createdTimestamp: batch.createdDate,
                lastUpdatedTimestamp: batch.lastUpdated,
                totalStatusChanges: batch.statusHistory ? batch.statusHistory.length : 0
            },
            
            traceability: {
                origin: {
                    farmer: batch.farmer,
                    location: batch.location,
                    coordinates: batch.coordinates
                },
                currentStatus: batch.status,
                crop: batch.crop,
                variety: batch.variety,
                quantity: batch.quantity,
                unit: batch.unit,
                harvestDate: batch.harvestDate,
                qualityGrade: batch.qualityGrade,
                certifications: batch.certifications || [],
                customCertification: batch.customCertification || null
            },

            // Pricing Transparency (Full Supply Chain)
            pricingInformation: {
                farmGatePrice: {
                    pricePerUnit: batch.pricePerUnit,
                    currency: batch.currency,
                    totalBatchValue: batch.totalBatchValue,
                    paymentMethod: batch.paymentMethod,
                    buyerName: batch.buyerName
                },
                currentPrice: {
                    pricePerUnit: batch.currentPricePerUnit || batch.pricePerUnit,
                    totalValue: batch.currentTotalValue || batch.totalBatchValue,
                    level: batch.currentLevel || 'FARMER',
                    currency: batch.currency
                },
                pricingHistory: batch.pricingHistory || [],
                priceIncrease: batch.pricingHistory && batch.pricingHistory.length >= 2 ?
                    this.calculatePriceIncreaseInline(batch.pricingHistory, batch.currency) : null
            },
            
            supplyChainSummary: {
                totalProcessingSteps: batch.processingRecords ? batch.processingRecords.length : 0,
                totalTransportSteps: batch.transportRecords ? batch.transportRecords.length : 0,
                totalQualityTests: batch.qualityTests ? batch.qualityTests.length : 0,
                totalFinancialTransactions: batch.financialTransactions ? batch.financialTransactions.length : 0,
                complianceStatus: batch.complianceChecks && batch.complianceChecks.length > 0 ? 'CHECKED' : 'PENDING'
            },
            
            // Data integrity information
            dataIntegrity: {
                blockchainHash: batch.dataHash || 'not_provided',
                recordComplete: this.checkRecordCompleteness(batch),
                lastVerified: verificationTimestamp.seconds.low + "." + verificationTimestamp.nanos
            }
        };

        console.info(`============= END : Verify Batch ${batchId} ===========`);
        return JSON.stringify(verification);
    }

    // Verify batch integrity with database hash
    async verifyBatchIntegrity(ctx, batchId, databaseHash) {
        console.info(`============= START : Verify Batch Integrity ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        const verificationTimestamp = ctx.stub.getTxTimestamp();

        const integrityCheck = {
            batchId: batchId,
            blockchainExists: true,
            databaseHash: databaseHash,
            storedHash: batch.dataHash,
            hashMatch: batch.dataHash === databaseHash,
            verificationTime: verificationTimestamp.seconds.low + "." + verificationTimestamp.nanos,
            verificationTxId: ctx.stub.getTxID(),
            integrityStatus: batch.dataHash === databaseHash ? 'VALID' : 'MISMATCH',
            message: batch.dataHash === databaseHash 
                ? 'Data integrity verified - blockchain and database are synchronized'
                : 'Data integrity check failed - blockchain and database hashes do not match'
        };

        console.info(`============= END : Verify Batch Integrity ${batchId} ===========`);
        return JSON.stringify(integrityCheck);
    }

    // Get all batches with filtering
    async getAllBatches(ctx, filters = "{}") {
        console.info('============= START : Get All Batches ===========');
        
        const allResults = [];
        let filterCriteria = {};
        
        try {
            filterCriteria = typeof filters === 'string' ? JSON.parse(filters) : filters;
        } catch (error) {
            console.warn('Invalid filter criteria, returning all batches');
        }
        
        // Get all keys from the ledger
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                // Only include records that look like batches
                if (record && record.batchId && record.docType === 'batch') {
                    // Apply filters if specified
                    if (this.matchesFilter(record, filterCriteria)) {
                        allResults.push(record);
                    }
                }
            } catch (err) {
                console.log('Error parsing record:', err);
                // Skip invalid records
            }
            result = await iterator.next();
        }
        
        await iterator.close();
        
        // Sort by creation date (newest first)
        allResults.sort((a, b) => {
            const aTime = parseFloat(a.createdDate) || 0;
            const bTime = parseFloat(b.createdDate) || 0;
            return bTime - aTime;
        });
        
        console.info(`Found ${allResults.length} batches matching criteria`);
        console.info('============= END : Get All Batches ===========');
        return JSON.stringify(allResults);
    }

    // Get batches by farmer
    async getBatchesByFarmer(ctx, farmerName) {
        console.info(`============= START : Get Batches By Farmer ${farmerName} ===========`);
        
        const filters = {
            farmer: farmerName
        };
        
        const result = await this.getAllBatches(ctx, JSON.stringify(filters));
        console.info(`============= END : Get Batches By Farmer ${farmerName} ===========`);
        return result;
    }

    // Get batch history (status changes)
    async getBatchHistory(ctx, batchId) {
        console.info(`============= START : Get Batch History ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        
        const history = {
            batchId: batchId,
            currentStatus: batch.status,
            statusHistory: batch.statusHistory || [],
            processingHistory: batch.processingRecords || [],
            transportHistory: batch.transportRecords || [],
            qualityTestHistory: batch.qualityTests || [],
            financialHistory: batch.financialTransactions || [],
            totalEvents: (batch.statusHistory || []).length + 
                        (batch.processingRecords || []).length + 
                        (batch.transportRecords || []).length + 
                        (batch.qualityTests || []).length + 
                        (batch.financialTransactions || []).length
        };

        console.info(`============= END : Get Batch History ${batchId} ===========`);
        return JSON.stringify(history);
    }

    // Validation helper
    async validateBatchData(farmer, crop, quantity, location) {
        const errors = [];

        if (!farmer || farmer.trim().length === 0) {
            errors.push("Farmer name is required");
        }

        if (!crop || crop.trim().length === 0) {
            errors.push("Crop type is required");
        }

        if (!quantity || isNaN(quantity) || parseFloat(quantity) <= 0) {
            errors.push("Valid quantity is required");
        }

        if (!location || location.trim().length === 0) {
            errors.push("Location is required");
        }

        return errors;
    }

    // Filter matching helper
    matchesFilter(record, filterCriteria) {
        if (!filterCriteria || Object.keys(filterCriteria).length === 0) {
            return true;
        }

        for (const [key, value] of Object.entries(filterCriteria)) {
            switch (key) {
                case 'farmer':
                    if (record.farmer && record.farmer.toLowerCase().includes(value.toLowerCase())) {
                        continue;
                    }
                    return false;
                
                case 'crop':
                    if (record.crop && record.crop.toLowerCase().includes(value.toLowerCase())) {
                        continue;
                    }
                    return false;
                
                case 'status':
                    if (record.status && record.status.toLowerCase() === value.toLowerCase()) {
                        continue;
                    }
                    return false;
                
                case 'location':
                    if (record.location && record.location.toLowerCase().includes(value.toLowerCase())) {
                        continue;
                    }
                    return false;
                
                default:
                    if (record[key] === value) {
                        continue;
                    }
                    return false;
            }
        }
        
        return true;
    }

    // Record completeness checker
    checkRecordCompleteness(batch) {
        const requiredFields = ['batchId', 'farmer', 'crop', 'quantity', 'location', 'status'];
        const missingFields = requiredFields.filter(field => !batch[field]);

        return {
            complete: missingFields.length === 0,
            completionPercentage: ((requiredFields.length - missingFields.length) / requiredFields.length) * 100,
            missingFields: missingFields,
            optionalFieldsPresent: {
                variety: !!batch.variety,
                coordinates: !!batch.coordinates,
                harvestDate: !!batch.harvestDate,
                qualityGrade: !!batch.qualityGrade,
                certifications: !!(batch.certifications && batch.certifications.length > 0)
            }
        };
    }

    // Helper function to calculate price increase inline (for verifyBatch)
    calculatePriceIncreaseInline(pricingHistory, currency) {
        if (!pricingHistory || pricingHistory.length < 2) {
            return null;
        }

        const farmPrice = pricingHistory.find(p => p.level === 'FARMER')?.pricePerUnit || 0;
        const currentPrice = pricingHistory[pricingHistory.length - 1].pricePerUnit;

        if (farmPrice === 0) {
            return null;
        }

        const increase = currentPrice - farmPrice;
        const percentageIncrease = (increase / farmPrice) * 100;

        return {
            absoluteIncrease: parseFloat(increase.toFixed(2)),
            percentageIncrease: percentageIncrease.toFixed(2) + '%',
            farmPrice: farmPrice,
            currentPrice: currentPrice,
            currency: currency || 'MYR',
            levels: pricingHistory.length
        };
    }

    // ===== BATCH TRANSFER & OWNERSHIP FUNCTIONS =====

    // Transfer batch ownership between supply chain actors
    async transferBatch(ctx, batchId, fromActorId, fromActorRole, toActorId, toActorRole, transferData) {
        console.info(`============= START : Transfer Batch ${batchId} ===========`);

        const exists = await this.batchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`The batch ${batchId} does not exist`);
        }

        const batch = await this.getBatch(ctx, batchId);
        const batchData = JSON.parse(batch);
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();

        // Parse transfer data
        let transfer = {};
        try {
            transfer = typeof transferData === 'string' ? JSON.parse(transferData) : transferData;
        } catch (error) {
            console.warn('Invalid transfer data provided');
        }

        // Initialize ownership history if not exists
        if (!batchData.ownershipHistory) {
            batchData.ownershipHistory = [];
        }

        // Create transfer record
        const transferRecord = {
            fromActorId: fromActorId,
            fromActorRole: fromActorRole,
            toActorId: toActorId,
            toActorRole: toActorRole,
            timestamp: timestamp.seconds.low + "." + timestamp.nanos,
            txId: txId,
            transferType: transfer.transferType || 'OWNERSHIP_TRANSFER',
            transferLocation: transfer.transferLocation || null,
            latitude: transfer.latitude || null,
            longitude: transfer.longitude || null,
            notes: transfer.notes || '',
            conditions: transfer.conditions || null,
            documents: transfer.documents || [],
            signature: transfer.signature || null
        };

        // Add to ownership history
        batchData.ownershipHistory.push(transferRecord);

        // Update current owner
        batchData.currentOwner = {
            actorId: toActorId,
            actorRole: toActorRole,
            since: timestamp.seconds.low + "." + timestamp.nanos
        };

        // Update status based on role transition
        const previousStatus = batchData.status;
        let newStatus = batchData.status;

        switch (toActorRole.toUpperCase()) {
            case 'PROCESSOR':
                newStatus = 'PROCESSING';
                break;
            case 'DISTRIBUTOR':
                newStatus = 'IN_DISTRIBUTION';
                break;
            case 'RETAILER':
                newStatus = 'RETAIL_READY';
                break;
        }

        // Add status update to history
        if (newStatus !== batchData.status) {
            if (!batchData.statusHistory) batchData.statusHistory = [];
            batchData.statusHistory.push({
                status: newStatus,
                updatedBy: toActorId,
                timestamp: timestamp.seconds.low + "." + timestamp.nanos,
                previousStatus: batchData.status,
                txId: txId,
                notes: `Batch transferred to ${toActorRole}`,
                location: transfer.transferLocation || null
            });
            batchData.status = newStatus;
        }

        batchData.lastUpdated = timestamp.seconds.low + "." + timestamp.nanos;
        batchData.lastUpdatedBy = toActorId;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        // Emit event for database synchronization
        ctx.stub.setEvent('BatchTransferred', Buffer.from(JSON.stringify({
            batchId: batchId,
            fromActorId: fromActorId,
            fromActorRole: fromActorRole,
            toActorId: toActorId,
            toActorRole: toActorRole,
            previousStatus: previousStatus,
            newStatus: newStatus,
            timestamp: transferRecord.timestamp,
            txId: txId
        })));

        console.info(`============= END : Transfer Batch ${batchId} ===========`);
        return JSON.stringify(transferRecord);
    }

    // Add transport/logistics record
    async addTransportRecord(ctx, batchId, transportData) {
        console.info(`============= START : Add Transport Record ${batchId} ===========`);

        const exists = await this.batchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`The batch ${batchId} does not exist`);
        }

        const batch = await this.getBatch(ctx, batchId);
        const batchData = JSON.parse(batch);
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();

        // Initialize transport records if not exists
        if (!batchData.transportRecords) {
            batchData.transportRecords = [];
        }

        // Parse transport data
        let transport = {};
        try {
            transport = typeof transportData === 'string' ? JSON.parse(transportData) : transportData;
        } catch (error) {
            console.warn('Invalid transport data provided');
        }

        const transportRecord = {
            transportId: transport.transportId || `TRANS${Date.now()}`,
            timestamp: timestamp.seconds.low + "." + timestamp.nanos,
            txId: txId,

            // Route information
            origin: transport.origin || null,
            originCoordinates: transport.originCoordinates || null,
            destination: transport.destination || null,
            destinationCoordinates: transport.destinationCoordinates || null,
            route: transport.route || [],

            // Transport details
            carrier: transport.carrier || null,
            vehicleType: transport.vehicleType || null,
            vehicleId: transport.vehicleId || null,
            driverName: transport.driverName || null,

            // Timing
            departureTime: transport.departureTime || null,
            estimatedArrival: transport.estimatedArrival || null,
            actualArrival: transport.actualArrival || null,

            // Conditions
            transportConditions: transport.transportConditions || null,
            temperatureControl: transport.temperatureControl || null,
            weatherConditions: transport.weatherConditions || null,

            // Costs
            transportCost: transport.transportCost ? parseFloat(transport.transportCost) : null,
            currency: transport.currency || 'MYR',
            fuelCost: transport.fuelCost ? parseFloat(transport.fuelCost) : null,
            tollFees: transport.tollFees ? parseFloat(transport.tollFees) : null,

            // Documentation
            waybillNumber: transport.waybillNumber || null,
            documents: transport.documents || [],
            notes: transport.notes || '',

            // Tracking
            trackingUpdates: transport.trackingUpdates || [],
            currentStatus: transport.currentStatus || 'IN_TRANSIT'
        };

        batchData.transportRecords.push(transportRecord);
        batchData.lastUpdated = timestamp.seconds.low + "." + timestamp.nanos;

        // Update batch status to IN_TRANSIT if appropriate
        if (transport.updateStatus && batchData.status !== 'IN_TRANSIT') {
            if (!batchData.statusHistory) batchData.statusHistory = [];
            batchData.statusHistory.push({
                status: 'IN_TRANSIT',
                updatedBy: transport.carrier || 'system',
                timestamp: timestamp.seconds.low + "." + timestamp.nanos,
                previousStatus: batchData.status,
                txId: txId,
                notes: `Transport started from ${transport.origin} to ${transport.destination}`,
                location: transport.origin || null
            });
            batchData.status = 'IN_TRANSIT';
        }

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        // Emit event for database synchronization
        ctx.stub.setEvent('TransportRecordAdded', Buffer.from(JSON.stringify({
            batchId: batchId,
            transportId: transportRecord.transportId,
            origin: transport.origin,
            destination: transport.destination,
            carrier: transport.carrier,
            timestamp: transportRecord.timestamp,
            txId: txId
        })));

        console.info(`============= END : Add Transport Record ${batchId} ===========`);
        return JSON.stringify(transportRecord);
    }

    // Get transport history for a batch
    async getTransportHistory(ctx, batchId) {
        console.info(`============= START : Get Transport History ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());

        const result = {
            batchId: batchId,
            currentOwner: batch.currentOwner || null,
            currentStatus: batch.status,
            transportRecords: batch.transportRecords || [],
            ownershipHistory: batch.ownershipHistory || [],
            totalTransportSteps: batch.transportRecords ? batch.transportRecords.length : 0,
            totalOwnershipChanges: batch.ownershipHistory ? batch.ownershipHistory.length : 0
        };

        console.info(`============= END : Get Transport History ${batchId} ===========`);
        return JSON.stringify(result);
    }

    // Get ownership history for a batch
    async getOwnershipHistory(ctx, batchId) {
        console.info(`============= START : Get Ownership History ${batchId} ===========`);

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());

        const result = {
            batchId: batchId,
            currentOwner: batch.currentOwner || {
                actorId: batch.farmer,
                actorRole: 'FARMER',
                since: batch.createdDate
            },
            ownershipHistory: batch.ownershipHistory || [],
            totalTransfers: batch.ownershipHistory ? batch.ownershipHistory.length : 0
        };

        console.info(`============= END : Get Ownership History ${batchId} ===========`);
        return JSON.stringify(result);
    }

    // ===== DISTRIBUTOR FUNCTIONS =====

    // Get batches available for distribution (PROCESSED status)
    async getAvailableBatchesForDistributor(ctx) {
        console.info('============= START : Get Available Batches For Distributor ===========');

        const allResults = [];

        // Get all batches with status PROCESSED (ready for distribution)
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                // Only include batches that are PROCESSED and NOT yet owned by a distributor
                if (record && record.batchId && record.docType === 'batch') {
                    if (record.status === 'PROCESSED' &&
                        (!record.currentOwner || record.currentOwner.actorRole !== 'DISTRIBUTOR')) {
                        allResults.push(record);
                    }
                }
            } catch (err) {
                console.log('Error parsing record:', err);
            }
            result = await iterator.next();
        }

        await iterator.close();

        // Sort by last updated (newest first)
        allResults.sort((a, b) => {
            const aTime = parseFloat(a.lastUpdated) || 0;
            const bTime = parseFloat(b.lastUpdated) || 0;
            return bTime - aTime;
        });

        console.info(`Found ${allResults.length} batches available for distribution`);
        console.info('============= END : Get Available Batches For Distributor ===========');
        return JSON.stringify(allResults);
    }

    // Add distribution record
    async addDistributionRecord(ctx, batchId, distributorId, distributionData) {
        console.info(`============= START : Add Distribution Record ${batchId} ===========`);

        const exists = await this.batchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`The batch ${batchId} does not exist`);
        }

        const batch = await this.getBatch(ctx, batchId);
        const batchData = JSON.parse(batch);
        const timestamp = ctx.stub.getTxTimestamp();
        const txId = ctx.stub.getTxID();

        // Initialize distribution records if not exists
        if (!batchData.distributionRecords) {
            batchData.distributionRecords = [];
        }

        // Parse distribution data
        let distribution = {};
        try {
            distribution = typeof distributionData === 'string' ? JSON.parse(distributionData) : distributionData;
        } catch (error) {
            console.warn('Invalid distribution data provided');
        }

        const distributionRecord = {
            distributorId: distributorId,
            timestamp: timestamp.seconds.low + "." + timestamp.nanos,
            txId: txId,

            // Distribution details
            distributionType: distribution.distributionType || null, // local, regional, national, export
            warehouseLocation: distribution.warehouseLocation || null,
            warehouseCoordinates: distribution.warehouseCoordinates || null,

            // Storage conditions
            storageConditions: distribution.storageConditions || null,
            temperatureControl: distribution.temperatureControl || null,
            humidity: distribution.humidity || null,

            // Logistics
            vehicleType: distribution.vehicleType || null,
            vehicleId: distribution.vehicleId || null,
            driverName: distribution.driverName || null,
            route: distribution.route || [],

            // Quantities
            quantityReceived: distribution.quantityReceived ? parseFloat(distribution.quantityReceived) : batchData.quantity,
            quantityDistributed: distribution.quantityDistributed ? parseFloat(distribution.quantityDistributed) : null,
            unit: distribution.unit || batchData.unit || 'kg',

            // Costs
            distributionCost: distribution.distributionCost ? parseFloat(distribution.distributionCost) : null,
            storageCost: distribution.storageCost ? parseFloat(distribution.storageCost) : null,
            handlingCost: distribution.handlingCost ? parseFloat(distribution.handlingCost) : null,
            currency: distribution.currency || 'MYR',

            // Quality check
            qualityCheckPassed: distribution.qualityCheckPassed || null,
            qualityNotes: distribution.qualityNotes || '',

            // Documentation
            documents: distribution.documents || [],
            notes: distribution.notes || '',

            // Destination
            destinationType: distribution.destinationType || null, // retailer, export, industrial
            destination: distribution.destination || null
        };

        batchData.distributionRecords.push(distributionRecord);
        batchData.lastUpdated = timestamp.seconds.low + "." + timestamp.nanos;
        batchData.lastUpdatedBy = distributorId;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batchData)));

        // Emit event for database synchronization
        ctx.stub.setEvent('DistributionRecordAdded', Buffer.from(JSON.stringify({
            batchId: batchId,
            distributorId: distributorId,
            distributionType: distribution.distributionType,
            destination: distribution.destination,
            timestamp: distributionRecord.timestamp,
            txId: txId
        })));

        console.info(`============= END : Add Distribution Record ${batchId} ===========`);
        return JSON.stringify(distributionRecord);
    }

    // Get batches by distributor (owned by distributor)
    async getBatchesByDistributor(ctx, distributorId) {
        console.info(`============= START : Get Batches By Distributor ${distributorId} ===========`);

        const allResults = [];

        // Get all batches owned by this distributor
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                if (record && record.batchId && record.docType === 'batch') {
                    // Check if current owner is this distributor
                    if (record.currentOwner &&
                        record.currentOwner.actorId === distributorId &&
                        record.currentOwner.actorRole === 'DISTRIBUTOR') {
                        allResults.push(record);
                    }
                }
            } catch (err) {
                console.log('Error parsing record:', err);
            }
            result = await iterator.next();
        }

        await iterator.close();

        // Sort by last updated (newest first)
        allResults.sort((a, b) => {
            const aTime = parseFloat(a.lastUpdated) || 0;
            const bTime = parseFloat(b.lastUpdated) || 0;
            return bTime - aTime;
        });

        console.info(`Found ${allResults.length} batches for distributor ${distributorId}`);
        console.info(`============= END : Get Batches By Distributor ${distributorId} ===========`);
        return JSON.stringify(allResults);
    }
}

module.exports = AgriculturalContract;