import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'renuga_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const query = async (text: string, params?: any[]) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(text, params || []);
    return { rows, rowCount: Array.isArray(rows) ? rows.length : 0 };
  } finally {
    connection.release();
  }
};

export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;
