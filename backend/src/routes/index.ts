import { Router } from 'express';
import authRoutes from './authRoutes';
import policyRoutes from './policyRoutes';
import { authenticate, authorize } from '../middleware/auth';
import { claimController } from '../controllers/claimController';
import { chatController } from '../controllers/chatController';
import { paymentController } from '../controllers/paymentController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/policies', policyRoutes);

router.use('/claims', authenticate);
router.post('/claims', claimController.submitClaim.bind(claimController));
router.get('/claims', claimController.getUserClaims.bind(claimController));
router.get('/claims/statistics', claimController.getClaimStatistics.bind(claimController));
router.get('/claims/:claimId', claimController.getClaimById.bind(claimController));
router.post('/claims/:claimId/documents', claimController.uploadDocuments.bind(claimController));
router.patch(
  '/claims/:claimId/review',
  authorize('admin', 'adjuster'),
  claimController.moveToReview.bind(claimController)
);
router.patch(
  '/claims/:claimId/approve',
  authorize('admin', 'adjuster'),
  claimController.approveClaim.bind(claimController)
);
router.patch(
  '/claims/:claimId/reject',
  authorize('admin', 'adjuster'),
  claimController.rejectClaim.bind(claimController)
);
router.patch(
  '/claims/:claimId/paid',
  authorize('admin', 'finance'),
  claimController.markAsPaid.bind(claimController)
);
router.get(
  '/claims/admin/statistics',
  authorize('admin'),
  claimController.getAllClaimStatistics.bind(claimController)
);

router.use('/chat', authenticate);
router.post('/chat/sessions', chatController.createChatSession.bind(chatController));
router.get('/chat/sessions', chatController.getUserChatSessions.bind(chatController));
router.get('/chat/sessions/:sessionId', chatController.getChatSession.bind(chatController));
router.patch('/chat/sessions/:sessionId/end', chatController.endChatSession.bind(chatController));
router.post('/chat/sessions/:sessionId/messages', chatController.sendMessage.bind(chatController));
router.get('/chat/suggestions', chatController.getSuggestedQuestions.bind(chatController));

router.use('/payments', authenticate);
router.post('/payments', paymentController.processPayment.bind(paymentController));
router.get('/payments', paymentController.getPaymentHistory.bind(paymentController));
router.get('/payments/methods/list', paymentController.getPaymentMethods.bind(paymentController));
router.post('/payments/methods', paymentController.addPaymentMethod.bind(paymentController));
router.delete('/payments/methods/:paymentMethodId', paymentController.removePaymentMethod.bind(paymentController));
router.patch('/payments/methods/:paymentMethodId/default', paymentController.setDefaultPaymentMethod.bind(paymentController));
router.get('/payments/:paymentId', paymentController.getPaymentById.bind(paymentController));
router.get('/payments/:paymentId/receipt', paymentController.generateReceipt.bind(paymentController));

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Intelligent Insurance Advisor API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      policies: '/api/v1/policies',
      claims: '/api/v1/claims',
      chat: '/api/v1/chat',
      payments: '/api/v1/payments',
    },
  });
});

export default router;

// Made with Bob
