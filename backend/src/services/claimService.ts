const { v4: uuidv4 } = require('uuid');
const db = require('../config/database').default || require('../config/database');

type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';

interface ClaimData {
  userId: string;
  policyId: string;
  type: string;
  amount: number;
  description: string;
  documents: string[];
}

export class ClaimService {
  private readonly validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
    SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'SUBMITTED'],
    APPROVED: ['PAID', 'REJECTED'],
    REJECTED: [],
    PAID: [],
  };

  async submitClaim(data: ClaimData) {
    const trx = await db.transaction();

    try {
      const policy = await trx('policies')
        .where({ policy_id: data.policyId, user_id: data.userId })
        .first();

      if (!policy) {
        throw new Error('Policy not found');
      }

      if (policy.status !== 'ACTIVE') {
        throw new Error('Policy is not active');
      }

      if (data.amount <= 0) {
        throw new Error('Claim amount must be positive');
      }

      const claimId = uuidv4();
      const claimNumber = this.generateClaimNumber();

      await trx('claims').insert({
        claim_id: claimId,
        user_id: data.userId,
        policy_id: data.policyId,
        claim_number: claimNumber,
        type: data.type,
        amount: data.amount,
        description: data.description,
        status: 'SUBMITTED',
        documents: JSON.stringify(data.documents || []),
        created_at: new Date(),
        updated_at: new Date(),
      });

      await trx('claim_state_transitions').insert({
        claim_id: claimId,
        from_state: null,
        to_state: 'SUBMITTED',
        changed_by: data.userId,
        changed_at: new Date(),
        reason: 'Claim submitted by user',
      });

      const claim = await trx('claims').where({ claim_id: claimId }).first();

      await trx.commit();

      return {
        claimId: claim.claim_id,
        claimNumber: claim.claim_number,
        type: claim.type,
        amount: Number(claim.amount),
        status: claim.status,
        createdAt: claim.created_at,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getClaimById(claimId: string, userId: string) {
    const claim = await db('claims')
      .where({ claim_id: claimId, user_id: userId })
      .first();

    if (!claim) {
      throw new Error('Claim not found');
    }

    const history = await db('claim_state_transitions')
      .where({ claim_id: claimId })
      .orderBy('changed_at', 'asc');

    return {
      claimId: claim.claim_id,
      claimNumber: claim.claim_number,
      policyId: claim.policy_id,
      type: claim.type,
      amount: Number(claim.amount),
      description: claim.description,
      status: claim.status,
      documents: this.parseJsonArray(claim.documents),
      createdAt: claim.created_at,
      updatedAt: claim.updated_at,
      stateHistory: history.map((h: any) => ({
        fromState: h.from_state,
        toState: h.to_state,
        transitionedBy: h.changed_by,
        transitionedAt: h.changed_at,
        reason: h.reason,
      })),
    };
  }

  async getUserClaims(userId: string, filters?: { status?: string; policyId?: string }) {
    let query = db('claims')
      .where({ 'claims.user_id': userId })
      .leftJoin('policies', 'claims.policy_id', 'policies.policy_id')
      .select('claims.*', 'policies.policy_number', 'policies.type as policy_type');

    if (filters?.status) {
      query = query.where('claims.status', filters.status);
    }

    if (filters?.policyId) {
      query = query.where('claims.policy_id', filters.policyId);
    }

    const claims = await query.orderBy('claims.created_at', 'desc');

    return claims.map((claim: any) => ({
      claimId: claim.claim_id,
      claimNumber: claim.claim_number,
      policyId: claim.policy_id,
      policyNumber: claim.policy_number,
      policyType: claim.policy_type,
      type: claim.type,
      amount: Number(claim.amount),
      status: claim.status,
      createdAt: claim.created_at,
    }));
  }

  async transitionClaimState(
    claimId: string,
    newState: ClaimStatus,
    transitionedBy: string,
    reason?: string
  ) {
    const trx = await db.transaction();

    try {
      const claim = await trx('claims').where({ claim_id: claimId }).first();

      if (!claim) {
        throw new Error('Claim not found');
      }

      const currentState = claim.status as ClaimStatus;

      if (!this.validTransitions[currentState]?.includes(newState)) {
        throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
      }

      await trx('claims')
        .where({ claim_id: claimId })
        .update({
          status: newState,
          updated_at: new Date(),
        });

      await trx('claim_state_transitions').insert({
        claim_id: claimId,
        from_state: currentState,
        to_state: newState,
        changed_by: transitionedBy,
        changed_at: new Date(),
        reason: reason || null,
      });

      await trx.commit();

      return {
        claimId,
        previousState: currentState,
        newState,
        transitionedAt: new Date(),
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async approveClaim(claimId: string, approvedBy: string, reason?: string) {
    return this.transitionClaimState(claimId, 'APPROVED', approvedBy, reason);
  }

  async rejectClaim(claimId: string, rejectedBy: string, reason?: string) {
    return this.transitionClaimState(claimId, 'REJECTED', rejectedBy, reason);
  }

  async markClaimAsPaid(claimId: string, paidBy: string, reason?: string) {
    return this.transitionClaimState(claimId, 'PAID', paidBy, reason);
  }

  async moveToReview(claimId: string, reviewedBy: string, reason?: string) {
    return this.transitionClaimState(claimId, 'UNDER_REVIEW', reviewedBy, reason);
  }

  async uploadDocuments(claimId: string, userId: string, newDocuments: string[]) {
    const claim = await db('claims')
      .where({ claim_id: claimId, user_id: userId })
      .first();

    if (!claim) {
      throw new Error('Claim not found');
    }

    if (['PAID', 'REJECTED'].includes(claim.status)) {
      throw new Error('Cannot upload documents to a finalized claim');
    }

    const existingDocuments = this.parseJsonArray(claim.documents);
    const updatedDocuments = [...existingDocuments, ...newDocuments];

    await db('claims')
      .where({ claim_id: claimId })
      .update({
        documents: JSON.stringify(updatedDocuments),
        updated_at: new Date(),
      });

    return {
      claimId,
      documentsAdded: newDocuments.length,
      totalDocuments: updatedDocuments.length,
    };
  }

  async getClaimStatistics(userId?: string) {
    let query = db('claims');

    if (userId) {
      query = query.where({ user_id: userId });
    }

    const stats = await query.clone().select('status').count('* as count').groupBy('status');
    const totalAmount = await query.clone().sum('amount as total').first();

    return {
      statusBreakdown: stats.reduce((acc: any, stat: any) => {
        acc[stat.status] = parseInt(stat.count, 10);
        return acc;
      }, {}),
      totalClaimsAmount: Number((totalAmount as any)?.total || 0),
      totalClaims: stats.reduce((sum: number, stat: any) => sum + parseInt(stat.count, 10), 0),
    };
  }

  private parseJsonArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private generateClaimNumber(): string {
    const prefix = 'CLM';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}

export const claimService = new ClaimService();

// Made with Bob
