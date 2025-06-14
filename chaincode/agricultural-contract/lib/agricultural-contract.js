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
    async createBatch(ctx, batchId, farmer, crop, quantity, location, additionalData = "{}") {
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

        // Parse additional data from database
        let extraData = {};
        try {
            extraData = typeof additionalData === 'string' ? JSON.parse(additionalData) : additionalData;
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
        
        // Add blockchain metadata
        batch.blockchainMetadata = {
            retrievedAt: new Date().toISOString(),
            network: 'mychannel',
            mspId: batch.mspId || 'unknown'
        };
        
        return JSON.stringify(batch);
    }

    // Check if batch exists
    async batchExists(ctx, batchId) {
        const batchJSON = await ctx.stub.getState(batchId);
        return batchJSON && batchJSON.length > 0;
    }

    // Enhanced status update with processing records
    async updateBatchStatus(ctx, batchId, status, updatedBy, timestamp, additionalData = "{}") {
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
            extraData = typeof additionalData === 'string' ? JSON.parse(additionalData) : additionalData;
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
                qualityGrade: batch.qualityGrade
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
}

module.exports = AgriculturalContract;