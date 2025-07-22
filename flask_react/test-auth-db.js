// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function testDatabaseConnection() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if better-auth tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%' OR table_name LIKE '%account%' OR table_name LIKE '%session%'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('📋 Found tables:', tablesResult.rows.map(row => row.table_name));
    
    // Check user table structure
    if (tablesResult.rows.length > 0) {
      for (const table of tablesResult.rows) {
        const structureQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `;
        
        const structureResult = await client.query(structureQuery, [table.table_name]);
        console.log(`\n📊 Table: ${table.table_name}`);
        structureResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    }
    
    // Check for users with the specific email
    const userQuery = `
      SELECT * FROM "user" WHERE email = $1 OR email = $2;
    `;
    
    const userResult = await client.query(userQuery, ['beto+3@gmail.com', 'betoiii+3@gmail.com']);
    console.log('\n👤 Users found:', userResult.rows.length);
    userResult.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection(); 