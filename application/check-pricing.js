// check-pricing.js - Quick script to check pricing data in batches
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPricing() {
    try {
        console.log('🔍 Checking recent batches for pricing data...\n');

        const batches = await prisma.batch.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                batchId: true,
                productType: true,
                quantity: true,
                unit: true,
                pricePerUnit: true,
                currency: true,
                totalBatchValue: true,
                paymentMethod: true,
                buyerName: true,
                createdAt: true
            }
        });

        console.log(`Found ${batches.length} recent batches:\n`);

        batches.forEach((batch, index) => {
            console.log(`${index + 1}. Batch ID: ${batch.batchId}`);
            console.log(`   Product: ${batch.productType}`);
            console.log(`   Quantity: ${batch.quantity} ${batch.unit}`);
            console.log(`   Price per Unit: ${batch.pricePerUnit ? `${batch.currency} ${batch.pricePerUnit}` : 'NOT SET ❌'}`);
            console.log(`   Total Value: ${batch.totalBatchValue ? `${batch.currency} ${batch.totalBatchValue}` : 'NOT SET ❌'}`);
            console.log(`   Payment Method: ${batch.paymentMethod || 'NOT SET ❌'}`);
            console.log(`   Buyer Name: ${batch.buyerName || 'NOT SET ❌'}`);
            console.log(`   Created: ${batch.createdAt}`);
            console.log('');
        });

        // Count how many have pricing data
        const withPricing = batches.filter(b => b.pricePerUnit !== null).length;
        const withoutPricing = batches.length - withPricing;

        console.log(`📊 Summary:`);
        console.log(`   Batches with pricing data: ${withPricing}`);
        console.log(`   Batches without pricing data: ${withoutPricing}`);

        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkPricing();
