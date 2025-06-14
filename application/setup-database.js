// setup-database.js
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // Connect to default database first
  password: 'your_password',
  port: 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    // Create database
    await client.query('CREATE DATABASE agricultural_supply_chain');
    console.log('Database created successfully');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database already exists');
    } else {
      throw error;
    }
  } finally {
    client.release();
  }
  
  // Connect to the new database and create tables
  const appPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'agricultural_supply_chain',
    password: 'your_password',
    port: 5432,
  });
  
  const appClient = await appPool.connect();
  
  try {
    // Read and execute schema file
    const schema = fs.readFileSync('database-schema.sql', 'utf8');
    await appClient.query(schema);
    console.log('Tables created successfully');
    
    // Insert sample data
    await insertSampleData(appClient);
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    appClient.release();
    await appPool.end();
  }
}

async function insertSampleData(client) {
  // Insert sample farmer
  await client.query(`
    INSERT INTO farmers (farmer_id, name, email, phone, farm_size_hectares) 
    VALUES ('FARMER_001', 'Ahmad Rahman', 'ahmad@farm.com', '+60123456789', 50.5)
    ON CONFLICT (farmer_id) DO NOTHING
  `);
  
  // Insert sample processing facility
  await client.query(`
    INSERT INTO processing_facilities (facility_id, facility_name, facility_type, latitude, longitude) 
    VALUES ('PROC_001', 'Selangor Rice Mill', 'mill', 3.1500, 101.7000)
    ON CONFLICT (facility_id) DO NOTHING
  `);
  
  console.log('Sample data inserted');
}

setupDatabase();