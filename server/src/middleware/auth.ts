import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Validate JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    pageAccess?: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const secret = process.env.JWT_SECRET || 'default-secret-key';

    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string; pageAccess?: string[] };
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      pageAccess: decoded.pageAccess,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// New middleware for page-level access control
export const authorizePageAccess = (...requiredPages: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Admin always has access
    if (req.user.role === 'Admin') {
      return next();
    }

    // Check if user has access to any of the required pages
    const userPages = req.user.pageAccess || [];
    const hasAccess = requiredPages.some(page => userPages.includes(page));

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied to this resource. Your account does not have permission to access this page.' 
      });
    }

    next();
  };
};
