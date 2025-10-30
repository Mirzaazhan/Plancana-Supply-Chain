// Test script to create a batch with complete pricing and certifications
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testCompleteBatch() {
    try {
        console.log('🧪 Testing Complete Batch Creation with Pricing & Certifications\n');

        // Step 1: Login as farmer
        console.log('Step 1: Login as farmer...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'farmer@test.com',
            password: 'password123'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed');
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`   User: ${loginResponse.data.user.username}`);
        console.log(`   Role: ${loginResponse.data.user.role}\n`);

        // Step 2: Create batch with complete data
        console.log('Step 2: Creating batch with complete pricing and certifications...');

        const batchData = {
            farmer: loginResponse.data.user.username,
            crop: 'Rice',
            quantity: 1000,
            location: 'Kedah, Malaysia',

            // Product Details
            variety: 'Basmati',
            unit: 'kg',
            harvestDate: new Date().toISOString(),
            cultivationMethod: 'organic',
            qualityGrade: 'premium',
            seedsSource: 'Certified Seed Company',
            irrigationMethod: 'drip',
            fertilizers: ['Organic Compost', 'Vermicompost'],
            pesticides: ['Neem Oil', 'Beneficial Insects'],

            // Pricing Information (Farm-gate level)
            pricePerUnit: 5.50,
            currency: 'MYR',
            totalBatchValue: 5500, // 1000 kg × MYR 5.50
            paymentMethod: 'bank-transfer',
            buyerName: 'Premium Rice Distributors Sdn Bhd',

            // Certifications
            certifications: [
                'Organic Certified',
                'MyGAP (Malaysian Good Agricultural Practice)',
                'GLOBALG.A.P',
                'Halal Certified',
                'Pesticide Free'
            ],
            customCertification: null,

            // Additional Info
            notes: 'High-quality organic Basmati rice, certified and ready for premium market distribution.',
            latitude: 6.1184,
            longitude: 100.3681
        };

        const createResponse = await axios.post(
            `${API_URL}/api/batch/create`,
            batchData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!createResponse.data.success) {
            console.error('❌ Batch creation failed:', createResponse.data.error);
            return;
        }

        console.log('✅ Batch created successfully!\n');
        console.log('📦 Batch Details:');
        console.log(`   Batch ID: ${createResponse.data.batchId}`);
        console.log(`   Product: ${batchData.crop} (${batchData.variety})`);
        console.log(`   Quantity: ${batchData.quantity} ${batchData.unit}`);
        console.log(`   Quality: ${batchData.qualityGrade}`);
        console.log(`   Cultivation: ${batchData.cultivationMethod}\n`);

        console.log('💰 Pricing Information:');
        console.log(`   Price per Unit: ${batchData.currency} ${batchData.pricePerUnit}`);
        console.log(`   Total Batch Value: ${batchData.currency} ${batchData.totalBatchValue.toLocaleString()}`);
        console.log(`   Payment Method: ${batchData.paymentMethod}`);
        console.log(`   Buyer: ${batchData.buyerName}\n`);

        console.log('🏆 Certifications:');
        batchData.certifications.forEach(cert => {
            console.log(`   ✓ ${cert}`);
        });
        console.log('');

        console.log('🔗 Verification URL:');
        console.log(`   ${createResponse.data.verificationUrl}`);
        console.log('');

        console.log('🌐 Open in Browser:');
        console.log(`   Frontend: http://localhost:3001/verify/${createResponse.data.batchId}`);
        console.log('');

        // Step 3: Verify the batch
        console.log('Step 3: Verifying batch data from blockchain...');
        const verifyResponse = await axios.get(`${API_URL}/api/verify/${createResponse.data.batchId}`);

        if (verifyResponse.data.success) {
            console.log('✅ Batch verified successfully!\n');

            console.log('📊 Blockchain Verification:');
            console.log(`   Batch exists in blockchain: ${!!verifyResponse.data.verification.blockchain}`);
            console.log(`   Batch exists in database: ${verifyResponse.data.verification.database.exists}`);
            console.log(`   Data integrity: ${verifyResponse.data.verification.dataIntegrity.message}\n`);

            if (verifyResponse.data.verification.blockchain) {
                const blockchain = verifyResponse.data.verification.blockchain;

                console.log('💎 Blockchain Data:');
                console.log(`   Crop: ${blockchain.traceability.crop}`);
                console.log(`   Variety: ${blockchain.traceability.variety}`);
                console.log(`   Quantity: ${blockchain.traceability.quantity} ${blockchain.traceability.unit}`);
                console.log(`   Quality: ${blockchain.traceability.qualityGrade}`);
                console.log(`   Certifications: ${blockchain.traceability.certifications.length} certificates\n`);

                console.log('💰 Blockchain Pricing:');
                console.log(`   Price/Unit: ${blockchain.pricingInformation.currency} ${blockchain.pricingInformation.pricePerUnit}`);
                console.log(`   Total Value: ${blockchain.pricingInformation.currency} ${blockchain.pricingInformation.totalBatchValue}`);
                console.log(`   Payment: ${blockchain.pricingInformation.paymentMethod}`);
                console.log(`   Buyer: ${blockchain.pricingInformation.buyerName}\n`);
            }
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ TEST COMPLETED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('📱 Next Steps:');
        console.log('   1. Open: http://localhost:3001/verify/' + createResponse.data.batchId);
        console.log('   2. Check that all pricing and certification data is displayed');
        console.log('   3. Verify blockchain transparency message is shown');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.details) {
            console.error('   Details:', error.response.data.details);
        }
    }
}

testCompleteBatch();
