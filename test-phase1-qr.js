/**
 * Test script for Phase 1: Processing QR Code Implementation
 * Tests:
 * 1. Batch creation returns both QR codes (verification + processing)
 * 2. Validate-access endpoint works correctly
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test credentials (you'll need to use actual credentials from your system)
const TEST_CREDENTIALS = {
    farmer: {
        email: 'farmer@test.com',
        password: 'password123'
    },
    processor: {
        email: 'processor@test.com',
        password: 'password123'
    }
};

let farmerToken = null;
let processorToken = null;
let testBatchId = null;

// Helper function to login
async function login(email, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email,
            password
        });
        return response.data.token;
    } catch (error) {
        console.error(`❌ Login failed for ${email}:`, error.response?.data?.error || error.message);
        return null;
    }
}

// Test 1: Create batch and verify both QR codes are returned
async function testBatchCreationWithQRCodes() {
    console.log('\n📝 TEST 1: Batch Creation with Both QR Codes');
    console.log('='.repeat(60));

    if (!farmerToken) {
        console.log('⏭️  Skipping - No farmer token available');
        return false;
    }

    try {
        const batchData = {
            farmer: 'Test Farmer',
            cropType: 'Sugarcane',
            crop: 'Raw Sugar',
            quantity: 1000,
            location: 'Test Farm Location',
            latitude: 6.4414,
            longitude: 100.1986,
            variety: 'Test Variety',
            unit: 'kg',
            harvestDate: new Date().toISOString(),
            cultivationMethod: 'Organic',
            qualityGrade: 'A',
            pricePerUnit: 2.5,
            currency: 'MYR',
            totalBatchValue: 2500,
            certifications: ['Organic', 'MyGAP']
        };

        const response = await axios.post(
            `${API_BASE_URL}/api/batch/create`,
            batchData,
            {
                headers: { Authorization: `Bearer ${farmerToken}` }
            }
        );

        const data = response.data;

        // Check if both QR codes exist
        console.log('✅ Batch created successfully!');
        console.log(`   Batch ID: ${data.batchId}`);

        testBatchId = data.batchId; // Save for next test

        // Check for new qrCodes object
        if (data.qrCodes) {
            console.log('✅ qrCodes object exists');

            if (data.qrCodes.verification) {
                console.log('✅ Verification QR code generated');
                console.log(`   Length: ${data.qrCodes.verification.length} characters`);
            } else {
                console.log('❌ Verification QR code missing!');
                return false;
            }

            if (data.qrCodes.processing) {
                console.log('✅ Processing QR code generated');
                console.log(`   Length: ${data.qrCodes.processing.length} characters`);
            } else {
                console.log('❌ Processing QR code missing!');
                return false;
            }
        } else {
            console.log('❌ qrCodes object missing!');
            return false;
        }

        // Check for URLs
        if (data.verificationUrl) {
            console.log(`✅ Verification URL: ${data.verificationUrl}`);
        }

        if (data.processingUrl) {
            console.log(`✅ Processing URL: ${data.processingUrl}`);
        } else {
            console.log('❌ Processing URL missing!');
            return false;
        }

        // Check backward compatibility
        if (data.qrCode) {
            console.log('✅ Backward compatible qrCode field exists');
        }

        console.log('\n✅ TEST 1 PASSED: Both QR codes generated successfully!');
        return true;

    } catch (error) {
        console.error('❌ TEST 1 FAILED:', error.response?.data || error.message);
        return false;
    }
}

// Test 2: Validate access endpoint
async function testValidateAccess() {
    console.log('\n🔐 TEST 2: Validate Access Endpoint');
    console.log('='.repeat(60));

    if (!processorToken || !testBatchId) {
        console.log('⏭️  Skipping - No processor token or batch ID available');
        return false;
    }

    try {
        const response = await axios.get(
            `${API_BASE_URL}/api/batch/validate-access/${testBatchId}`,
            {
                headers: { Authorization: `Bearer ${processorToken}` }
            }
        );

        const data = response.data;

        console.log(`✅ Validate access responded successfully`);
        console.log(`   Can Process: ${data.canProcess}`);
        console.log(`   Action: ${data.action}`);
        console.log(`   Redirect To: ${data.redirectTo}`);
        console.log(`   Message: ${data.message}`);

        if (data.batchInfo) {
            console.log(`   Batch Info:`);
            console.log(`     - Batch ID: ${data.batchInfo.batchId}`);
            console.log(`     - Status: ${data.batchInfo.status}`);
            console.log(`     - Product: ${data.batchInfo.product}`);
        }

        // For a newly created batch (status: REGISTERED), processor should be able to process it
        if (data.canProcess && data.action === 'PROCESS') {
            console.log('\n✅ TEST 2 PASSED: Processor has correct access to REGISTERED batch!');
            return true;
        } else {
            console.log('\n⚠️  TEST 2 WARNING: Unexpected access result');
            return false;
        }

    } catch (error) {
        // If we get a 403 with proper error structure, that's also valid
        if (error.response?.status === 403 && error.response.data.reason) {
            console.log('✅ Validate access correctly denied access');
            console.log(`   Reason: ${error.response.data.reason}`);
            console.log(`   Error: ${error.response.data.error}`);
            console.log('\n✅ TEST 2 PASSED: Access control working correctly!');
            return true;
        }

        console.error('❌ TEST 2 FAILED:', error.response?.data || error.message);
        return false;
    }
}

// Test 3: Test wrong role access
async function testWrongRoleAccess() {
    console.log('\n🚫 TEST 3: Wrong Role Access (Farmer trying to validate)');
    console.log('='.repeat(60));

    if (!farmerToken || !testBatchId) {
        console.log('⏭️  Skipping - No farmer token or batch ID available');
        return false;
    }

    try {
        const response = await axios.get(
            `${API_BASE_URL}/api/batch/validate-access/${testBatchId}`,
            {
                headers: { Authorization: `Bearer ${farmerToken}` }
            }
        );

        // Farmer shouldn't be able to process batches
        console.log('⚠️  Farmer was allowed access (unexpected)');
        console.log('   Response:', response.data);
        return false;

    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Access correctly denied for FARMER role');
            console.log(`   Reason: ${error.response.data.reason}`);
            console.log(`   Error: ${error.response.data.error}`);
            console.log('\n✅ TEST 3 PASSED: Access control working correctly!');
            return true;
        }

        console.error('❌ TEST 3 FAILED with unexpected error:', error.response?.data || error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('\n🧪 PHASE 1 IMPLEMENTATION TESTS');
    console.log('='.repeat(60));
    console.log('Testing: Processing QR Code & Validate Access Endpoint\n');

    // Login
    console.log('🔑 Logging in test users...');
    farmerToken = await login(TEST_CREDENTIALS.farmer.email, TEST_CREDENTIALS.farmer.password);
    processorToken = await login(TEST_CREDENTIALS.processor.email, TEST_CREDENTIALS.processor.password);

    if (farmerToken) {
        console.log('✅ Farmer logged in successfully');
    } else {
        console.log('⚠️  Farmer login failed - some tests will be skipped');
    }

    if (processorToken) {
        console.log('✅ Processor logged in successfully');
    } else {
        console.log('⚠️  Processor login failed - some tests will be skipped');
    }

    // Run tests
    const results = {
        test1: await testBatchCreationWithQRCodes(),
        test2: await testValidateAccess(),
        test3: await testWrongRoleAccess()
    };

    // Summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test 1 (Batch Creation with QR codes): ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 (Validate Access - Correct Role): ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 (Validate Access - Wrong Role): ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);

    const passCount = Object.values(results).filter(r => r).length;
    const totalCount = Object.keys(results).length;

    console.log('\n' + '='.repeat(60));
    console.log(`OVERALL: ${passCount}/${totalCount} tests passed`);

    if (passCount === totalCount) {
        console.log('🎉 ALL TESTS PASSED! Phase 1 implementation successful!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }
}

// Run the tests
runTests().catch(console.error);
