import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';
import bcrypt from 'bcrypt';

// Tasks, Customers, Users, Shift Notes, Remark Logs

// Tasks
export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY due_date');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id, type, linkedTo, linkedId, customerName, dueDate, status, assignedTo, remarks } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO tasks (id, type, linked_to, linked_id, customer_name, due_date, status, assigned_to, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, type, linkedTo, linkedId, customerName, dueDate, status, assignedTo, remarks]
    );

    res.status(201).json(rows[0]);
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

    const { rows } = await pool.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Customers
export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, mobile, email, address, totalOrders, totalValue } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO customers (id, name, mobile, email, address, total_orders, total_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, name, mobile, email || null, address || null, totalOrders || 0, totalValue || 0]
    );

    res.status(201).json(rows[0]);
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

    const { rows } = await pool.query(
      `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, page_access FROM users ORDER BY name`
    );
    
    // Parse page_access JSON strings
    const usersWithParsedAccess = rows.map(user => ({
      ...user,
      pageAccess: user.page_access ? JSON.parse(user.page_access) : []
    }));
    
    res.json(usersWithParsedAccess);
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

    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, is_active, page_access)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, is_active, page_access`,
      [id, name, email.toLowerCase(), passwordHash, role, isActive !== false, accessToSet]
    );

    const user = rows[0];
    res.status(201).json({
      ...user,
      pageAccess: user.page_access ? JSON.parse(user.page_access) : []
    });
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

    let query = `UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, page_access = $5, updated_at = CURRENT_TIMESTAMP`;
    let params: any[] = [name, email.toLowerCase(), role, isActive !== false, accessToSet];

    // If password is provided, hash and update it
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      params.push(passwordHash);
      query += `, password_hash = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING id, name, email, role, is_active, page_access`;

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    res.json({
      ...user,
      pageAccess: user.page_access ? JSON.parse(user.page_access) : []
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Shift Notes
export const getAllShiftNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM shift_notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching shift notes:', error);
    res.status(500).json({ error: 'Failed to fetch shift notes' });
  }
};

export const createShiftNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id, createdBy, content, isActive } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO shift_notes (id, created_by, content, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, createdBy, content, isActive !== undefined ? isActive : true]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating shift note:', error);
    res.status(500).json({ error: 'Failed to create shift note' });
  }
};

export const updateShiftNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isActive } = req.body;

    const { rows } = await pool.query(
      `UPDATE shift_notes SET content = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id, content, isActive]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shift note not found' });
    }

    res.json(rows[0]);
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
      query += ' WHERE entity_type = $1 AND entity_id = $2';
      params.push(entityType, entityId);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching remark logs:', error);
    res.status(500).json({ error: 'Failed to fetch remark logs' });
  }
};

export const createRemarkLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id, entityType, entityId, remark, createdBy } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO remark_logs (id, entity_type, entity_id, remark, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, entityType, entityId, remark, createdBy]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating remark log:', error);
    res.status(500).json({ error: 'Failed to create remark log' });
  }
};
