import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool, { getConnection } from '../config/database.js';

// Validate JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Validate JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, password_hash, role, is_active, page_access FROM users WHERE email = ?',
        [email.toLowerCase()]
      ) as any;

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = rows[0];

      if (!user.is_active) {
        return res.status(401).json({ error: 'User account is inactive' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Parse page access from database
      let pageAccess: string[] = [];
      if (user.page_access) {
        try {
          pageAccess = JSON.parse(user.page_access);
        } catch (e) {
          pageAccess = [];
        }
      }

      // Generate JWT token
      const secret = process.env.JWT_SECRET || 'default-secret-key';

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, pageAccess },
        secret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          pageAccess,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'default-secret-key';

    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string; pageAccess?: string[] };

    // Fetch current user data
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, role, is_active, page_access FROM users WHERE id = ?',
        [decoded.id]
      ) as any;

      if (rows.length === 0 || !rows[0].is_active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Parse page access from database
      let pageAccess: string[] = [];
      if (rows[0].page_access) {
        try {
          pageAccess = JSON.parse(rows[0].page_access);
        } catch (e) {
          pageAccess = [];
        }
      }

      res.json({
        valid: true,
        user: {
          id: rows[0].id,
          name: rows[0].name,
          email: rows[0].email,
          role: rows[0].role,
          isActive: rows[0].is_active,
          pageAccess,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  res.json({ success: true, message: 'Logged out successfully' });
};
