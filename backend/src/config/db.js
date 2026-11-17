import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const useSsl = process.env.DB_SSL === 'true' || process.env.DB_PORT === '4000';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jewellery_procurement_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '15', 10),
  queueLimit: 0,
  decimalNumbers: true,
  timezone: '+00:00',
  ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {})
};

const pool = mysql.createPool(dbConfig);

// Helper function to test DB connectivity
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (SSL: ${useSsl ? 'ON' : 'OFF'})`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[Database Error] Connection failed to ${dbConfig.host}:${dbConfig.port}:`, error.message);
    return false;
  }
}

export default pool;
