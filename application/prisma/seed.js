// prisma/seed.js
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// --- Initialize Prisma and define raw SQL helper ---
const prisma = new PrismaClient();

// NOTE: This MUST be defined here to execute raw PostGIS SQL
async function updateGeometryPoint(tableName, id, lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return;
  }
  const srid = 4326;

  try {
    // ✅ CRITICAL FIX: Explicitly cast the SRID parameter to INTEGER
    // and ensure ST_MakePoint result is cast to GEOMETRY before ST_SetSRID.
    await prisma.$executeRaw(Prisma.sql`
                    UPDATE ${Prisma.raw(tableName)}
                    SET geom_point = public.ST_SetSRID(
                        public.ST_MakePoint(${lng}::double precision, ${lat}::double precision)::geometry, 
                        ${srid}::integer
                    )::geography
                    WHERE id = ${id}
                `);
    console.log(`✅ PostGIS: Updated geometry for ${tableName} ID ${id}`);
  } catch (error) {
    // This MUST re-throw so the main route can catch the error and respond once.
    console.error(`❌ PostGIS Error updating ${tableName}:`, error.message);
    throw error;
  }
}

// --- MAIN SEEDING FUNCTION ---
async function main() {
  console.log("🌱 Seeding database...");

  try {
    // --- 1. ADMIN USER ---
    const adminPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.upsert({
      where: { email: "admin@agricultural.com" },
      update: {},
      create: {
        email: "admin@agricultural.com",
        username: "admin",
        password: adminPassword,
        role: "ADMIN",
        status: "ACTIVE",
        adminProfile: {
          create: { firstName: "System", lastName: "Administrator" },
        },
      },
    });

    // --- 2. FARMER USER AND LOCATION (Origin Node) ---
    const farmerPassword = await bcrypt.hash("farmer123", 12);
    const farmer = await prisma.user.upsert({
      where: { email: "ahmad@farm.com" },
      update: {},
      create: {
        email: "ahmad@farm.com",
        username: "ahmad_farmer",
        password: farmerPassword,
        role: "FARMER",
        status: "ACTIVE",
        farmerProfile: {
          create: {
            firstName: "Ahmad",
            lastName: "Rahman",
            farmName: "Rahman Organic Farm",
            farmSize: 50.5,
            primaryCrops: ["RICE"],
            address: "Lot 123, Jalan Pertanian, Sungai Besar, Selangor",
            state: "Selangor",
          },
        },
      },
    });

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: farmer.id },
    });

    let farmLocationRecord = null;
    if (farmerProfile) {
      farmLocationRecord = await prisma.farmLocation.upsert({
        where: { id: "farm-location-1" },
        update: { latitude: 3.6891, longitude: 101.521 },
        create: {
          id: "farm-location-1",
          farmerId: farmerProfile.id,
          farmName: "Main Paddy Field",
          latitude: 3.6891,
          longitude: 101.521,
          soilType: "Clay",
        },
      });
      // ⭐ GIS WRITE: Populate geom_point column for Farm Location
      await updateGeometryPoint(
        '"farm_locations"',
        farmLocationRecord.id,
        farmLocationRecord.latitude,
        farmLocationRecord.longitude
      );
    }

    // --- 3. PROCESSOR USER AND FACILITY (Transformation Node) ---
    const processorPassword = await bcrypt.hash("processor123", 12);
    const processor = await prisma.user.upsert({
      where: { email: "mill@processor.com" },
      update: {},
      create: {
        email: "mill@processor.com",
        username: "selangor_mill",
        password: processorPassword,
        role: "PROCESSOR",
        status: "ACTIVE",
        processorProfile: {
          create: {
            companyName: "Selangor Rice Mill Sdn Bhd",
            contactPerson: "Lim Wei Ming",
            processingCapacity: 100.0,
            address: "Industrial Area Klang, Selangor",
            state: "Selangor",
          },
        },
      },
    });

    const processorProfile = await prisma.processorProfile.findUnique({
      where: { userId: processor.id },
    });

    let processorFacilityRecord = null;
    if (processorProfile) {
      processorFacilityRecord = await prisma.processingFacility.upsert({
        where: { id: "processor-facility-1" },
        update: { latitude: 3.0319, longitude: 101.4078 },
        create: {
          id: "processor-facility-1",
          processorId: processorProfile.id,
          facilityName: "Main Rice Mill",
          facilityType: "MILL",
          latitude: 3.0319,
          longitude: 101.4078,
          address: "Lot 456, Kawasan Perindustrian Klang",
          capacity: 100.0,
        },
      });
      // ⭐ GIS WRITE: Populate geom_point column for Processor Facility
      await updateGeometryPoint(
        '"processing_facilities"',
        processorFacilityRecord.id,
        processorFacilityRecord.latitude,
        processorFacilityRecord.longitude
      );
    }

    // --- 4. DISTRIBUTOR USER (Logistics Node) ---
    const distributorPassword = await bcrypt.hash("distributor123", 12);
    const distributor = await prisma.user.upsert({
      where: { email: "logistics@distributor.com" },
      update: {},
      create: {
        email: "logistics@distributor.com",
        username: "kl_logistics",
        password: distributorPassword,
        role: "DISTRIBUTOR",
        status: "ACTIVE",
        distributorProfile: {
          create: {
            companyName: "KL Logistics Sdn Bhd",
            contactPerson: "Rajesh Kumar",
            storageCapacity: 5000.0,
            address: "Shah Alam, Selangor",
            state: "Selangor",
          },
        },
      },
    });

    const distributorProfile = await prisma.distributorProfile.findUnique({
      where: { userId: distributor.id },
    });

    // --- 5. RETAILER (Destination Node - Requires Geocoding/Manual Coordinates) ---
    const retailerPassword = await bcrypt.hash("retailer123", 12);
    const retailer = await prisma.user.upsert({
      where: { email: "store@retail.com" },
      update: {},
      create: {
        email: "store@retail.com",
        username: "city_supermarket",
        password: retailerPassword,
        role: "RETAILER",
        status: "ACTIVE",
        retailerProfile: {
          create: {
            businessName: "City Grocer KLCC",
            contactPerson: "Susan Lee",
            address: "Jalan Ampang, Kuala Lumpur",
            state: "Kuala Lumpur",
            // Manually setting coordinates for map visualization
            latitude: 3.1578,
            longitude: 101.7119,
          },
        },
      },
    });

    const retailerProfile = await prisma.retailerProfile.findUnique({
      where: { userId: retailer.id },
    });

    if (retailerProfile) {
      // ⭐ GIS WRITE: Populate geom_point column for Retailer
      await updateGeometryPoint(
        '"retailer_profiles"',
        retailerProfile.id,
        retailerProfile.latitude,
        retailerProfile.longitude
      );
    }

    // --- 6. SAMPLE BATCH JOURNEY (Farm -> Processor) ---
    let sampleBatch = null;
    if (farmerProfile) {
      sampleBatch = await prisma.batch.upsert({
        where: { batchId: "RICE-2025-ROUTE" },
        update: { status: "PROCESSED" },
        create: {
          batchId: "RICE-2025-ROUTE",
          farmerId: farmerProfile.id,
          farmLocationId: farmLocationRecord?.id,
          productType: "RICE",
          quantity: 5000.0,
          unit: "kg",
          harvestDate: new Date("2025-10-01"),
          status: "PROCESSED",
          pricePerUnit: 2.5,
          currency: "MYR",
          totalBatchValue: 12500.0,
          blockchainHash: "dummy_hash_for_route_demo",
          dataHash: "dummy_data_hash_for_route_demo",
        },
      });
    }

    // --- 7. SAMPLE PROCESSING RECORD ---
    if (sampleBatch && processorFacilityRecord && processorProfile) {
      await prisma.processingRecord.upsert({
        where: { id: "sample-processing-route-record" },
        update: {},
        create: {
          id: "sample-processing-route-record",
          batchId: sampleBatch.id,
          processorId: processorProfile.id,
          facilityId: processorFacilityRecord.id,
          processingDate: new Date("2025-10-10"),
          processingType: "MILLING_AND_PACKAGING",
          inputQuantity: sampleBatch.quantity,
          outputQuantity: sampleBatch.quantity,
          operatorName: "mill_operator",
        },
      });
    }

    // --- 8. SAMPLE TRANSPORT ROUTE (Processor Mill -> Retailer) ---
    if (
      distributorProfile &&
      sampleBatch &&
      processorFacilityRecord &&
      retailerProfile
    ) {
      const originLat = processorFacilityRecord.latitude; // Mill: 3.0319
      const originLng = processorFacilityRecord.longitude; // Mill: 101.4078
      const destinationLat = retailerProfile.latitude; // Retailer: 3.1578
      const destinationLng = retailerProfile.longitude; // Retailer: 101.7119

      // Dummy Encoded Polyline string (ArcGIS Pro will decode this to draw a line)
      const dummyPolyline = "y~_c@gxtbTehG?g@y{O?_@gq@?k@";

      await prisma.transportRoute.upsert({
        where: { id: "sample-transport-route" },
        update: {},
        create: {
          id: "sample-transport-route",
          batchId: sampleBatch.id,
          distributorId: distributorProfile.id,
          originLat: originLat,
          originLng: originLng,
          destinationLat: destinationLat,
          destinationLng: destinationLng,
          departureTime: new Date("2025-10-11T10:00:00Z"),
          estimatedTime: 65,
          distance: 58.2,
          transportCost: 180.0,
          routePolyline: dummyPolyline,
          status: "IN_TRANSIT",
        },
      });

      // ⭐ GIS WRITE: You would update the geom_route column here if needed, but we rely on routePolyline.
    }

    console.log("✅ Database seeded successfully!");
    // ... console logs ...
  } catch (error) {
    console.error("❌ Seeding error:", error);
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
