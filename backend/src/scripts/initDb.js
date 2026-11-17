import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('[DB Init] Starting Database & Views Initialization...');

  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_PORT === '4000';

  const rootConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {})
  };

  let connection;
  try {
    connection = await mysql.createConnection(rootConfig);
    console.log(`[DB Init] Connected to MySQL server on ${rootConfig.host}:${rootConfig.port} (SSL: ${useSsl ? 'ON' : 'OFF'}).`);

    // 1. Execute Schema SQL
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    console.log(`[DB Init] Reading schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[DB Init] Creating database and tables...');
    await connection.query(schemaSql);
    console.log('[DB Init] Tables created successfully!');

    // 2. Execute Views SQL
    const viewsPath = path.resolve(__dirname, '../../../database/views.sql');
    console.log(`[DB Init] Reading analytical views from: ${viewsPath}`);
    const viewsSql = fs.readFileSync(viewsPath, 'utf8');

    console.log('[DB Init] Creating analytical views...');
    await connection.query(viewsSql);
    console.log('[DB Init] Analytical views created successfully!');

    console.log('[DB Init] Database initialization complete!');
  } catch (err) {
    console.error('[DB Init Error]:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
