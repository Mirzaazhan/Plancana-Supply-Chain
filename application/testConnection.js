const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function testConnection() {
    try {
        console.log('🔄 Testing blockchain connection...');
        
        // Create wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if appUser exists
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('❌ appUser identity not found in wallet');
            return;
        }
        console.log('✅ appUser identity found');

        // Load connection profile
        const connectionProfilePath = path.resolve(__dirname, '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        
        if (!fs.existsSync(connectionProfilePath)) {
            console.log('❌ Connection profile not found at:', connectionProfilePath);
            return;
        }
        console.log('✅ Connection profile found');

        const connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));

        // Create gateway connection
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });
        console.log('✅ Connected to gateway');

        // Get network and contract
        const network = await gateway.getNetwork('mychannel');
        console.log('✅ Connected to channel: mychannel');
        
        const contract = network.getContract('agricultural-contract');
        console.log('✅ Connected to contract: agricultural-contract');

        // Test a simple query
        const result = await contract.evaluateTransaction('getAllBatches');
        console.log('✅ Successfully queried blockchain!');
        console.log('📊 Current batches:', JSON.parse(result.toString()));

        await gateway.disconnect();
        console.log('🎉 Connection test successful! API should work now.');

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
    }
}

testConnection();
