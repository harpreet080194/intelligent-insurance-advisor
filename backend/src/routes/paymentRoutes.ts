import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { paymentController } from '../controllers/paymentController';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Payment processing
router.post('/', paymentController.processPayment.bind(paymentController));
router.get('/', paymentController.getPaymentHistory.bind(paymentController));
router.get('/:paymentId', paymentController.getPaymentById.bind(paymentController));
router.get('/:paymentId/receipt', paymentController.generateReceipt.bind(paymentController));

// Payment methods management
router.get('/methods/list', paymentController.getPaymentMethods.bind(paymentController));
router.post('/methods', paymentController.addPaymentMethod.bind(paymentController));
router.delete('/methods/:paymentMethodId', paymentController.removePaymentMethod.bind(paymentController));
router.patch('/methods/:paymentMethodId/default', paymentController.setDefaultPaymentMethod.bind(paymentController));

export default router;

// Made with Bob
