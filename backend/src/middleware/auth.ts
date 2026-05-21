import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role?: string;
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    }

    if (error?.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }

    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new Error('Unauthorized'));
    }

    if (roles.length > 0 && !roles.includes(req.user.role || '')) {
      return next(new Error('Forbidden'));
    }

    next();
  };
};

// Made with Bob
