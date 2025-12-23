import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool, { getConnection } from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM products ORDER BY name');
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, category, unit, price, availableQuantity, thresholdQuantity, status, isActive } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO products 
         (id, name, category, unit, price, available_quantity, threshold_quantity, status, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, category, unit, price, availableQuantity, thresholdQuantity, status, isActive !== undefined ? isActive : true]
      );

      const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('products', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id, ...values]
      );

      const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const result = await connection.execute('DELETE FROM products WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, message: 'Product deleted' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
