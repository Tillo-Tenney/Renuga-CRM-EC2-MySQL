import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool, { getConnection } from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';
import { parseDate } from '../utils/dateUtils.js';

export const getAllCallLogs = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM call_logs ORDER BY call_date DESC'
      ) as any;
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching call logs:', error);
    res.status(500).json({ error: 'Failed to fetch call logs' });
  }
};

export const getCallLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM call_logs WHERE id = ?', [id]) as any;
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Call log not found' });
      }
      
      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching call log:', error);
    res.status(500).json({ error: 'Failed to fetch call log' });
  }
};

export const createCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const {
      id,
      callDate,
      customerName,
      mobile,
      queryType,
      productInterest,
      nextAction,
      followUpDate,
      remarks,
      assignedTo,
      status,
    } = req.body;

    // Validate required fields
    if (!id || !callDate || !customerName || !mobile || !assignedTo || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, callDate, customerName, mobile, assignedTo, status' 
      });
    }

    // Parse and validate dates
    let parsedCallDate: string | null;
    let parsedFollowUpDate: string | null = null;

    try {
      parsedCallDate = parseDate(callDate);
      if (!parsedCallDate) {
        return res.status(400).json({ error: 'Invalid call date' });
      }
      if (followUpDate) {
        parsedFollowUpDate = parseDate(followUpDate);
      }
    } catch (dateError) {
      return res.status(400).json({ 
        error: `Invalid date format: ${dateError instanceof Error ? dateError.message : String(dateError)}` 
      });
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO call_logs 
         (id, call_date, customer_name, mobile, query_type, product_interest, 
          next_action, follow_up_date, remarks, assigned_to, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, parsedCallDate, customerName, mobile, queryType || null, productInterest || null, 
         nextAction, parsedFollowUpDate, remarks || null, assignedTo, status]
      );

      // Fetch the created record to confirm
      const [rows] = await connection.execute('SELECT * FROM call_logs WHERE id = ?', [id]) as any;
      if (rows.length === 0) {
        return res.status(500).json({ error: 'Failed to retrieve created call log' });
      }
      res.status(201).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating call log:', error);
    res.status(500).json({ 
      error: 'Failed to create call log',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('callLogs', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE call_logs SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id, ...values]
      );

      const [rows] = await connection.execute('SELECT * FROM call_logs WHERE id = ?', [id]) as any;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Call log not found' });
      }

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating call log:', error);
    res.status(500).json({ error: 'Failed to update call log' });
  }
};

export const deleteCallLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute('DELETE FROM call_logs WHERE id = ?', [id]) as any;

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Call log not found' });
      }

      res.json({ success: true, message: 'Call log deleted' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting call log:', error);
    res.status(500).json({ error: 'Failed to delete call log' });
  }
};
