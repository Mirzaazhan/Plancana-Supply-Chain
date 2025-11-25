// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@agricultural.com' },
      update: {},
      create: {
        email: 'admin@agricultural.com',
        username: 'admin',
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
        adminProfile: {
          create: {
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+60123456789',
            adminLevel: 'SUPER_ADMIN',
            permissions: [
              'user_management',
              'system_config',
              'blockchain_admin',
              'data_export'
            ]
          }
        }
      }
    });
    
    // Create sample farmer
    const farmerPassword = await bcrypt.hash('farmer123', 12);
    const farmer = await prisma.user.upsert({
      where: { email: 'ahmad@farm.com' },
      update: {},
      create: {
        email: 'ahmad@farm.com',
        username: 'ahmad_farmer',
        password: farmerPassword,
        role: 'FARMER',
        status: 'ACTIVE',
        isEmailVerified: true,
        farmerProfile: {
          create: {
            firstName: 'Ahmad',
            lastName: 'Rahman',
            phone: '+60123456789',
            farmName: 'Rahman Organic Farm',
            farmSize: 50.5,
            farmingType: ['ORGANIC', 'CONVENTIONAL'],
            primaryCrops: ['RICE', 'CORN', 'VEGETABLES'],
            certifications: ['ORGANIC_MALAYSIA', 'HALAL'],
            address: 'Lot 123, Jalan Pertanian, Sungai Besar, Selangor',
            state: 'Selangor',
            isVerified: true,
            verifiedAt: new Date()
          }
        }
      }
    });
    
    // Create farm location for farmer
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: farmer.id }
    });
    
    if (farmerProfile) {
      const farmLocation = await prisma.farmLocation.upsert({
        where: { id: 'existing-farm-location' }, // This will fail and go to create
        update: {},
        create: {
          farmerId: farmerProfile.id,
          farmName: 'Main Paddy Field',
          latitude: 3.6891,
          longitude: 101.5210,
          elevation: 25.5,
          soilType: 'Clay',
          soilPh: 6.5,
          farmBoundary: {
            type: 'Polygon',
            coordinates: [[
              [101.5200, 3.6880],
              [101.5220, 3.6880],
              [101.5220, 3.6900],
              [101.5200, 3.6900],
              [101.5200, 3.6880]
            ]]
          }
        }
      }).catch(() => {
        // Farm location might already exist, that's fine
        return null;
      });
    }
    
    // Create sample processor
    const processorPassword = await bcrypt.hash('processor123', 12);
    const processor = await prisma.user.upsert({
      where: { email: 'mill@processor.com' },
      update: {},
      create: {
        email: 'mill@processor.com',
        username: 'selangor_mill',
        password: processorPassword,
        role: 'PROCESSOR',
        status: 'ACTIVE',
        isEmailVerified: true,
        processorProfile: {
          create: {
            companyName: 'Selangor Rice Mill Sdn Bhd',
            contactPerson: 'Lim Wei Ming',
            phone: '+60387654321',
            email: 'operations@selangormill.com',
            facilityType: ['MILL', 'WAREHOUSE'],
            processingCapacity: 100.0,
            certifications: ['HACCP', 'ISO22000', 'HALAL'],
            licenseNumber: 'MILL2024001',
            address: 'Industrial Area Klang, Selangor',
            state: 'Selangor',
            isVerified: true
          }
        }
      }
    });
    
    // Create processing facility
    const processorProfile = await prisma.processorProfile.findUnique({
      where: { userId: processor.id }
    });
    
    if (processorProfile) {
      await prisma.processingFacility.upsert({
        where: { id: 'existing-facility' }, // This will fail and go to create
        update: {},
        create: {
          processorId: processorProfile.id,
          facilityName: 'Main Rice Mill',
          facilityType: 'MILL',
          latitude: 3.0319,
          longitude: 101.4078,
          address: 'Lot 456, Kawasan Perindustrian Klang',
          capacity: 100.0,
          certifications: ['HACCP', 'HALAL'],
          equipmentList: ['Husking Machine', 'Polishing Machine', 'Grading Machine'],
          isActive: true
        }
      }).catch(() => {
        // Facility might already exist
        return null;
      });
    }
    
    // Create sample distributor
    const distributorPassword = await bcrypt.hash('distributor123', 12);
    await prisma.user.upsert({
      where: { email: 'logistics@distributor.com' },
      update: {},
      create: {
        email: 'logistics@distributor.com',
        username: 'kl_logistics',
        password: distributorPassword,
        role: 'DISTRIBUTOR',
        status: 'ACTIVE',
        isEmailVerified: true,
        distributorProfile: {
          create: {
            companyName: 'KL Logistics Sdn Bhd',
            contactPerson: 'Rajesh Kumar',
            phone: '+60312345678',
            email: 'dispatch@kllogistics.com',
            distributionType: ['REGIONAL', 'NATIONAL'],
            vehicleTypes: ['TRUCK', 'VAN'],
            storageCapacity: 5000.0,
            licenseNumber: 'DIST2024001',
            address: 'Shah Alam, Selangor',
            state: 'Selangor',
            isVerified: true
          }
        }
      }
    });
    
    // Create sample regulator
    const regulatorPassword = await bcrypt.hash('regulator123', 12);
    await prisma.user.upsert({
      where: { email: 'inspector@mardi.gov.my' },
      update: {},
      create: {
        email: 'inspector@mardi.gov.my',
        username: 'mardi_inspector',
        password: regulatorPassword,
        role: 'REGULATOR',
        status: 'ACTIVE',
        isEmailVerified: true,
        regulatorProfile: {
          create: {
            firstName: 'Siti',
            lastName: 'Aminah',
            agency: 'MARDI',
            position: 'Senior Inspector',
            phone: '+60387654321',
            email: 'siti.aminah@mardi.gov.my',
            jurisdiction: ['SELANGOR', 'KUALA_LUMPUR'],
            authorities: ['INSPECTION', 'CERTIFICATION', 'ENFORCEMENT'],
            employeeId: 'MARDI2024001'
          }
        }
      }
    });
    
    console.log('✅ Database seeded successfully!');
    console.log('📋 Sample users created:');
    console.log('   👑 Admin: admin@agricultural.com / admin123');
    console.log('   🌾 Farmer: ahmad@farm.com / farmer123');
    console.log('   🏭 Processor: mill@processor.com / processor123');
    console.log('   🚛 Distributor: logistics@distributor.com / distributor123');
    console.log('   🏛️ Regulator: inspector@mardi.gov.my / regulator123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });