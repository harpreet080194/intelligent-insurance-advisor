import { claimService } from '../services/claimService';

export class ClaimController {
  async submitClaim(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const { policyId, type, amount, description, documents } = req.body;

      if (!policyId || !type || !amount || !description) {
        throw new Error('Policy ID, type, amount, and description are required');
      }

      const claim = await claimService.submitClaim({
        userId,
        policyId,
        type,
        amount: parseFloat(amount),
        description,
        documents: Array.isArray(documents) ? documents : [],
      });

      res.status(201).json({
        success: true,
        message: 'Claim submitted successfully',
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClaimById(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const claim = await claimService.getClaimById(req.params.claimId, userId);

      res.json({
        success: true,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserClaims(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const claims = await claimService.getUserClaims(userId, {});

      res.json({
        success: true,
        count: claims.length,
        data: claims,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadDocuments(req: any, res: any, next: any) {
    try {
      const userId = req.user.userId;
      const { documents } = req.body;

      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents array is required');
      }

      const result = await claimService.uploadDocuments(req.params.claimId, userId, documents);

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClaimStatistics(req: any, res: any, next: any) {
    try {
      const statistics = await claimService.getClaimStatistics(req.user.userId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  async moveToReview(req: any, res: any, next: any) {
    try {
      const result = await claimService.moveToReview(req.params.claimId, req.user.userId, req.body?.reason);

      res.json({
        success: true,
        message: 'Claim moved to review',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveClaim(req: any, res: any, next: any) {
    try {
      const result = await claimService.approveClaim(req.params.claimId, req.user.userId, req.body?.reason);

      res.json({
        success: true,
        message: 'Claim approved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectClaim(req: any, res: any, next: any) {
    try {
      if (!req.body?.reason) {
        throw new Error('Reason is required for claim rejection');
      }

      const result = await claimService.rejectClaim(req.params.claimId, req.user.userId, req.body.reason);

      res.json({
        success: true,
        message: 'Claim rejected',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req: any, res: any, next: any) {
    try {
      const result = await claimService.markClaimAsPaid(req.params.claimId, req.user.userId, req.body?.reason);

      res.json({
        success: true,
        message: 'Claim marked as paid',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllClaimStatistics(_req: any, res: any, next: any) {
    try {
      const statistics = await claimService.getClaimStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const claimController = new ClaimController();

// Made with Bob
