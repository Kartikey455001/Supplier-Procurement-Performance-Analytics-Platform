import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder, parent folder, or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const useSsl = process.env.DB_SSL === 'true' || process.env.DB_PORT === '4000' || (!process.env.DB_HOST || process.env.DB_HOST.includes('tidbcloud.com'));

const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DB_PORT || '4000', 10),
  user: process.env.DB_USER || '43VuQDB9CLULgYi.root',
  password: process.env.DB_PASSWORD || 'jnWmXAv9WtH8SuyT',
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
