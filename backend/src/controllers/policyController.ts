import { policyService } from '../services/policyService';

export class PolicyController {
  async createPolicy(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const body = req.body || {};
      const type = body.type;
      const premium = body.premium;
      const coverage = body.coverage;
      const providerId = body.providerId;

      if (!type || !premium || !coverage) {
        throw new Error('Type, premium, and coverage are required');
      }

      const validTypes = ['HEALTH', 'AUTO', 'HOME', 'LIFE'];
      if (!validTypes.includes(type)) {
        throw new Error('Invalid policy type');
      }

      const policy = await policyService.createPolicy({
        userId,
        type,
        premium: parseFloat(String(premium)),
        coverage,
        providerId,
      });

      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPolicyById(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const policyId = req.params?.policyId;

      const policy = await policyService.getPolicyById(policyId, userId);

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPolicies(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const type = req.query?.type;
      const status = req.query?.status;
      const filters: any = {};

      if (typeof type === 'string') {
        filters['type'] = type;
      }

      if (typeof status === 'string') {
        filters['status'] = status;
      }

      const policies = await policyService.getUserPolicies(userId, filters);

      res.json({
        success: true,
        count: policies.length,
        data: policies,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePolicyStatus(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const policyId = req.params?.policyId;
      const status = req.body?.status;

      const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid policy status');
      }

      const policy = await policyService.updatePolicyStatus(policyId, userId, status);

      res.json({
        success: true,
        message: 'Policy status updated successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPolicyRecommendations(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const budget = req.query?.budget;

      const recommendations = await policyService.getPolicyRecommendations({
        userId,
        budget: budget ? parseFloat(String(budget)) : undefined,
      });

      res.json({
        success: true,
        count: recommendations.length,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  async comparePolicies(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const policyIds = req.body?.policyIds;

      if (!Array.isArray(policyIds) || policyIds.length === 0) {
        throw new Error('Policy IDs array is required');
      }

      const comparison = await policyService.comparePolicies(policyIds, userId);

      res.json({
        success: true,
        count: comparison.length,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const policyController = new PolicyController();

// Made with Bob
