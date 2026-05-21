import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { policyController } from '../controllers/policyController';

const router = Router();

// All policy routes require authentication
router.use(authenticate);

// Policy recommendations (must be before /:policyId to avoid route conflict)
router.get('/recommendations/personalized', policyController.getPolicyRecommendations.bind(policyController));

// Policy comparison
router.post('/compare', policyController.comparePolicies.bind(policyController));

// Policy management routes
router.post('/', policyController.createPolicy.bind(policyController));
router.get('/', policyController.getUserPolicies.bind(policyController));
router.get('/:policyId', policyController.getPolicyById.bind(policyController));
router.patch('/:policyId/status', policyController.updatePolicyStatus.bind(policyController));

export default router;

// Made with Bob
