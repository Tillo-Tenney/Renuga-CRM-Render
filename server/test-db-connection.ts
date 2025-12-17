import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('---');

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    const dbResult = await client.query('SELECT current_database()');
    console.log('Current database:', dbResult.rows[0].current_database);
    
    const userResult = await client.query('SELECT current_user');
    console.log('Current user:', userResult.rows[0].current_user);
    
    client.release();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error);
    process.exit(1);
  }
}

testConnection();
