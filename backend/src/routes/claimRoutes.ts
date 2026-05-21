import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { claimController } from '../controllers/claimController';

const claimRoutes = Router();

claimRoutes.use(authenticate);

claimRoutes.post('/', claimController.submitClaim.bind(claimController));
claimRoutes.get('/', claimController.getUserClaims.bind(claimController));
claimRoutes.get('/statistics', claimController.getClaimStatistics.bind(claimController));
claimRoutes.get('/:claimId', claimController.getClaimById.bind(claimController));
claimRoutes.post('/:claimId/documents', claimController.uploadDocuments.bind(claimController));

claimRoutes.patch(
  '/:claimId/review',
  authorize('admin', 'adjuster'),
  claimController.moveToReview.bind(claimController)
);

claimRoutes.patch(
  '/:claimId/approve',
  authorize('admin', 'adjuster'),
  claimController.approveClaim.bind(claimController)
);

claimRoutes.patch(
  '/:claimId/reject',
  authorize('admin', 'adjuster'),
  claimController.rejectClaim.bind(claimController)
);

claimRoutes.patch(
  '/:claimId/paid',
  authorize('admin', 'finance'),
  claimController.markAsPaid.bind(claimController)
);

claimRoutes.get(
  '/admin/statistics',
  authorize('admin'),
  claimController.getAllClaimStatistics.bind(claimController)
);

export default claimRoutes;

// Made with Bob
