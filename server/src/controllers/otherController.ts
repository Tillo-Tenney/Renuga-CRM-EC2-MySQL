import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool, { getConnection } from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';
import bcrypt from 'bcrypt';

// Tasks, Customers, Users, Shift Notes, Remark Logs

// Tasks
export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM tasks ORDER BY due_date');
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id, type, linkedTo, linkedId, customerName, dueDate, status, assignedTo, remarks } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO tasks (id, type, linked_to, linked_id, customer_name, due_date, status, assigned_to, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, type, linkedTo, linkedId, customerName, dueDate, status, assignedTo, remarks]
      );

      const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('tasks', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id, ...values]
      );

      const [rows] = await connection.execute('SELECT * FROM tasks WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const result = await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ success: true, message: 'Task deleted' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Customers
export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM customers ORDER BY name');
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, mobile, email, address, totalOrders, totalValue } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO customers (id, name, mobile, email, address, total_orders, total_value)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, mobile, email || null, address || null, totalOrders || 0, totalValue || 0]
      );

      const [rows] = await connection.execute('SELECT * FROM customers WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('customers', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id, ...values]
      );

      const [rows] = await connection.execute('SELECT * FROM customers WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, name, email, role, is_active, page_access FROM users ORDER BY name`
      );
      
      // Parse page_access JSON strings
      const usersWithParsedAccess = (rows as any[]).map(user => ({
        ...user,
        pageAccess: user.page_access ? JSON.parse(user.page_access) : []
      }));
      
      res.json(usersWithParsedAccess);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, email, password, role, isActive, pageAccess } = req.body;

    if (!id || !name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine page access - Admin gets all pages
    const accessToSet = role === 'Admin' 
      ? JSON.stringify(['Dashboard', 'CallLog', 'Leads', 'Orders', 'MasterData'])
      : JSON.stringify(pageAccess || []);

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO users (id, name, email, password_hash, role, is_active, page_access)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email.toLowerCase(), passwordHash, role, isActive !== false, accessToSet]
      );

      const [rows] = await connection.execute(
        'SELECT id, name, email, role, is_active, page_access FROM users WHERE id = ?',
        [id]
      );

      const user = rows[0];
      res.status(201).json({
        ...user,
        pageAccess: user.page_access ? JSON.parse(user.page_access) : []
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password, pageAccess } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine page access - Admin gets all pages
    const accessToSet = role === 'Admin' 
      ? JSON.stringify(['Dashboard', 'CallLog', 'Leads', 'Orders', 'MasterData'])
      : JSON.stringify(pageAccess || []);

    const connection = await pool.getConnection();
    try {
      let query = `UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, page_access = ?, updated_at = CURRENT_TIMESTAMP`;
      let params: any[] = [name, email.toLowerCase(), role, isActive !== false, accessToSet];

      // If password is provided, hash and update it
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        params.push(passwordHash);
        query += `, password_hash = ?`;
      }

      params.push(id);
      query += ` WHERE id = ?`;

      await connection.execute(query, params);

      const [rows] = await connection.execute(
        'SELECT id, name, email, role, is_active, page_access FROM users WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = rows[0];
      res.json({
        ...user,
        pageAccess: user.page_access ? JSON.parse(user.page_access) : []
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Shift Notes
export const getAllShiftNotes = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM shift_notes ORDER BY created_at DESC');
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching shift notes:', error);
    res.status(500).json({ error: 'Failed to fetch shift notes' });
  }
};

export const createShiftNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id, createdBy, content, isActive } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO shift_notes (id, created_by, content, is_active)
         VALUES (?, ?, ?, ?)`,
        [id, createdBy, content, isActive !== undefined ? isActive : true]
      );

      const [rows] = await connection.execute('SELECT * FROM shift_notes WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating shift note:', error);
    res.status(500).json({ error: 'Failed to create shift note' });
  }
};

export const updateShiftNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isActive } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE shift_notes SET content = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [content, isActive, id]
      );

      const [rows] = await connection.execute('SELECT * FROM shift_notes WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Shift note not found' });
      }

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating shift note:', error);
    res.status(500).json({ error: 'Failed to update shift note' });
  }
};

// Remark Logs
export const getRemarkLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.query;

    let query = 'SELECT * FROM remark_logs';
    const params: any[] = [];

    if (entityType && entityId) {
      query += ' WHERE entity_type = ? AND entity_id = ?';
      params.push(entityType, entityId);
    }

    query += ' ORDER BY created_at DESC';

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, params);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching remark logs:', error);
    res.status(500).json({ error: 'Failed to fetch remark logs' });
  }
};

export const createRemarkLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id, entityType, entityId, remark, createdBy } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO remark_logs (id, entity_type, entity_id, remark, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [id, entityType, entityId, remark, createdBy]
      );

      const [rows] = await connection.execute('SELECT * FROM remark_logs WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating remark log:', error);
    res.status(500).json({ error: 'Failed to create remark log' });
  }
};
