import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (with stricter rate limiting)
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/password/change', authController.changePassword);

// MFA routes
router.post('/mfa/enable', authController.enableMfa);
router.post('/mfa/verify', authController.verifyMfa);
router.post('/mfa/disable', authController.disableMfa);

export default router;

// Made with Bob
