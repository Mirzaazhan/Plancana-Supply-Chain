// Seed script to add mock Quality Tests and Transport Records for screenshots
// Run with: node seed-mock-data.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMockData() {
  try {
    // Get the first batch to add mock data to
    const batch = await prisma.batch.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { farmer: true }
    });

    if (!batch) {
      console.log('❌ No batches found. Please create a batch first.');
      return;
    }

    console.log(`📦 Found batch: ${batch.batchId}`);

    // Get a distributor for transport routes
    const distributor = await prisma.distributorProfile.findFirst();

    if (!distributor) {
      console.log('⚠️ No distributor found. Transport routes will be skipped.');
    }

    // ==================== QUALITY TESTS ====================
    console.log('\n🧪 Creating Quality Test records...');

    const qualityTests = [
      {
        batchId: batch.id,
        testType: 'Comprehensive Quality Analysis',
        testDate: new Date(),
        testingLab: 'Malaysian Agricultural Research Institute (MARDI)',
        testResults: {
          pesticideResidue: 0.02,
          heavyMetals: 0.001,
          microbialCount: 150,
          moistureContent: 12.5,
          proteinContent: 8.2,
          grade: 'A',
          aflatoxinLevel: 0.5,
          foreignMatter: 0.1
        },
        passFailStatus: 'PASS',
        certificateUrl: 'https://mardi.gov.my/cert/QA-2024-001234'
      },
      {
        batchId: batch.id,
        testType: 'Pesticide Residue Test',
        testDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        testingLab: 'SGS Malaysia Sdn Bhd',
        testResults: {
          pesticideResidue: 0.015,
          organophosphates: 'Not Detected',
          pyrethroids: 'Not Detected',
          carbamates: 'Not Detected'
        },
        passFailStatus: 'PASS',
        certificateUrl: 'https://sgs.com/cert/PR-2024-005678'
      },
      {
        batchId: batch.id,
        testType: 'Heavy Metals Analysis',
        testDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        testingLab: 'Bureau Veritas Malaysia',
        testResults: {
          heavyMetals: 0.002,
          lead: 0.0008,
          cadmium: 0.0005,
          mercury: 0.0001,
          arsenic: 0.0006
        },
        passFailStatus: 'PASS',
        certificateUrl: 'https://bureauveritas.com/cert/HM-2024-009012'
      }
    ];

    for (const test of qualityTests) {
      await prisma.qualityTest.create({ data: test });
      console.log(`  ✅ Created: ${test.testType}`);
    }

    // ==================== TRANSPORT ROUTES ====================
    if (distributor) {
      console.log('\n🚚 Creating Transport Route records...');

      const transportRoutes = [
        {
          batchId: batch.id,
          distributorId: distributor.id,
          vehicleId: 'WKL 8834',
          originLat: 3.1390,
          originLng: 101.6869,
          destinationLat: 3.0738,
          destinationLng: 101.5183,
          departureTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          arrivalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
          estimatedTime: 90, // 1.5 hours in minutes
          distance: 45.2,
          fuelConsumption: 8.5,
          transportCost: 120.00,
          status: 'DELIVERED'
        },
        {
          batchId: batch.id,
          distributorId: distributor.id,
          vehicleId: 'JHR 5521',
          originLat: 3.0738,
          originLng: 101.5183,
          destinationLat: 2.9264,
          destinationLng: 101.6424,
          departureTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          arrivalTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // +1.5 hours
          estimatedTime: 75, // 1.25 hours in minutes
          distance: 32.8,
          fuelConsumption: 6.2,
          transportCost: 95.00,
          status: 'DELIVERED'
        },
        {
          batchId: batch.id,
          distributorId: distributor.id,
          vehicleId: 'PKN 2247',
          originLat: 2.9264,
          originLng: 101.6424,
          destinationLat: 3.1569,
          destinationLng: 101.7123,
          departureTime: new Date(), // Today
          arrivalTime: null, // Not arrived yet
          estimatedTime: 60, // 1 hour in minutes
          distance: 28.5,
          fuelConsumption: null, // Not completed
          transportCost: 85.00,
          status: 'IN_TRANSIT'
        }
      ];

      for (const route of transportRoutes) {
        await prisma.transportRoute.create({ data: route });
        console.log(`  ✅ Created: Route via ${route.vehicleId} (${route.status})`);
      }
    }

    console.log('\n✨ Mock data seeded successfully!');
    console.log(`\n📋 Summary for batch ${batch.batchId}:`);
    console.log(`   - Quality Tests: ${qualityTests.length} records`);
    console.log(`   - Transport Routes: ${distributor ? 3 : 0} records`);
    console.log('\n🎯 Now go to Batch Details and check the Quality Tests and Transport tabs!');

  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMockData();
