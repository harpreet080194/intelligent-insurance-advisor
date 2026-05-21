import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import authService from '../services/authService';

class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, profile, preferences } = req.body || {};

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (String(password).length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const result = await authService.register({
        email,
        password,
        profile,
        preferences,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, mfaCode } = req.body || {};

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const result = await authService.login({
        email,
        password,
        mfaCode,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body?.refreshToken;

      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async enableMfa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new Error('Unauthorized');
      }

      const result = await authService.enableMfa(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'MFA setup initiated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyMfa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new Error('Unauthorized');
      }

      const code = req.body?.code;

      if (!code) {
        throw new Error('MFA code is required');
      }

      await authService.verifyAndEnableMfa(req.user.userId, code);

      res.status(200).json({
        success: true,
        message: 'MFA enabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async disableMfa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new Error('Unauthorized');
      }

      const password = req.body?.password;

      if (!password) {
        throw new Error('Password is required');
      }

      await authService.disableMfa(req.user.userId, password);

      res.status(200).json({
        success: true,
        message: 'MFA disabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new Error('Unauthorized');
      }

      const { oldPassword, newPassword } = req.body || {};

      if (!oldPassword || !newPassword) {
        throw new Error('Old password and new password are required');
      }

      if (String(newPassword).length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      await authService.changePassword(req.user.userId, oldPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: {
          userId: req.user?.userId || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new Error('Unauthorized');
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

// Made with Bob
