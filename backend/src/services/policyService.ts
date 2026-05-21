import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

class PolicyServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'PolicyServiceError';
    this.statusCode = statusCode;
  }
}

interface PolicyData {
  userId: string;
  type: 'HEALTH' | 'AUTO' | 'HOME' | 'LIFE';
  premium: number;
  coverage: Record<string, any>;
  providerId?: string;
}

interface PolicyRecommendationParams {
  userId: string;
  preferences?: Record<string, any>;
  budget?: number;
}

export class PolicyService {
  async createPolicy(data: PolicyData) {
    try {
      if (data.premium <= 0) {
        throw new PolicyServiceError('Premium must be positive', 400);
      }

      const policyNumber = this.generatePolicyNumber(data.type);
      const policyId = uuidv4();

      await db('policies').insert({
        policy_id: policyId,
        user_id: data.userId,
        policy_number: policyNumber,
        type: data.type,
        status: 'ACTIVE',
        premium: data.premium,
        coverage: JSON.stringify(data.coverage ?? {}),
        provider_id: data.providerId || uuidv4(),
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date(),
        updated_at: new Date(),
      });

      const policy = await db('policies').where({ policy_id: policyId }).first();

      if (!policy) {
        throw new PolicyServiceError('Failed to create policy', 500);
      }

      console.log(`Policy created: ${policy.policy_id}`, { policyNumber });

      return this.mapPolicy(policy);
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  async getPolicyById(policyId: string, userId: string) {
    try {
      const policy = await db('policies')
        .where({ policy_id: policyId, user_id: userId })
        .first();

      if (!policy) {
        throw new PolicyServiceError('Policy not found', 404);
      }

      return this.mapPolicy(policy, true);
    } catch (error) {
      console.error('Error fetching policy:', error);
      throw error;
    }
  }

  async getUserPolicies(userId: string, filters?: { type?: string; status?: string }) {
    try {
      let query = db('policies').where({ user_id: userId });

      if (filters && typeof filters.type === 'string' && filters.type.trim()) {
        query = query.where({ type: filters.type });
      }

      if (filters && typeof filters.status === 'string' && filters.status.trim()) {
        query = query.where({ status: filters.status });
      }

      const policies = await query.orderBy('created_at', 'desc');
      return policies.map((policy) => this.mapPolicy(policy));
    } catch (error) {
      console.error('Error fetching user policies:', error);
      throw error;
    }
  }

  async updatePolicyStatus(
    policyId: string,
    userId: string,
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  ) {
    try {
      await db('policies')
        .where({ policy_id: policyId, user_id: userId })
        .update({
          status,
          updated_at: new Date(),
        });

      const policy = await db('policies')
        .where({ policy_id: policyId, user_id: userId })
        .first();

      if (!policy) {
        throw new PolicyServiceError('Policy not found', 404);
      }

      console.log(`Policy status updated: ${policyId} -> ${status}`);

      return {
        policyId: policy.policy_id,
        status: policy.status,
        updatedAt: policy.updated_at,
      };
    } catch (error) {
      console.error('Error updating policy status:', error);
      throw error;
    }
  }

  async getPolicyRecommendations(params: PolicyRecommendationParams) {
    try {
      const user = await db('users').where({ user_id: params.userId }).first();

      if (!user) {
        throw new PolicyServiceError('User not found', 404);
      }

      const profile = JSON.parse(user.profile || '{}');
      const preferences = params.preferences || JSON.parse(user.preferences || '{}');

      const existingPolicies = await db('policies')
        .where({ user_id: params.userId, status: 'ACTIVE' })
        .select('type');

      const existingTypes = existingPolicies.map((p: any) => p.type);

      const recommendations = this.generateRecommendations(
        profile,
        preferences,
        params.budget,
        existingTypes
      );

      console.log(`Generated ${recommendations.length} policy recommendations for user ${params.userId}`);

      return recommendations;
    } catch (error) {
      console.error('Error generating policy recommendations:', error);
      throw error;
    }
  }

  async comparePolicies(policyIds: string[], userId: string) {
    try {
      const policies = await db('policies')
        .whereIn('policy_id', policyIds)
        .where({ user_id: userId });

      if (!policies.length) {
        throw new PolicyServiceError('No policies found', 404);
      }

      return policies.map((policy) => ({
        policyId: policy.policy_id,
        policyNumber: policy.policy_number,
        type: policy.type,
        premium: Number(policy.premium),
        coverage: this.parseCoverage(policy.coverage),
        status: policy.status,
      }));
    } catch (error) {
      console.error('Error comparing policies:', error);
      throw error;
    }
  }

  private mapPolicy(policy: any, includeExtra = false) {
    const base = {
      policyId: policy.policy_id,
      policyNumber: policy.policy_number,
      type: policy.type,
      status: policy.status,
      premium: Number(policy.premium),
      coverage: this.parseCoverage(policy.coverage),
      createdAt: policy.created_at,
    };

    if (!includeExtra) {
      return base;
    }

    return {
      ...base,
      providerId: policy.provider_id,
      updatedAt: policy.updated_at,
    };
  }

  private parseCoverage(coverage: any) {
    if (!coverage) {
      return {};
    }

    if (typeof coverage === 'object') {
      return coverage;
    }

    try {
      return JSON.parse(coverage);
    } catch {
      return {};
    }
  }

  private generatePolicyNumber(type: string): string {
    const prefix = type.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  private generateRecommendations(
    profile: any,
    _preferences: any,
    budget?: number,
    existingTypes: string[] = []
  ) {
    const recommendations: any[] = [];

    if (!existingTypes.includes('HEALTH')) {
      const age = profile.age || 30;
      const hasFamily = profile.familySize > 1;

      recommendations.push({
        type: 'HEALTH',
        name: hasFamily ? 'Family Health Insurance' : 'Individual Health Insurance',
        description: 'Comprehensive health coverage with cashless hospitalization',
        estimatedPremium: this.calculateHealthPremium(age, hasFamily),
        coverage: {
          hospitalization: '₹5,00,000',
          preExisting: 'Covered after 2 years',
          dayCareProcedures: 'Covered',
          ambulance: '₹2,000 per trip',
        },
        benefits: [
          'Cashless hospitalization at 10,000+ hospitals',
          'Pre and post hospitalization coverage',
          'No claim bonus up to 50%',
          'Tax benefits under Section 80D',
        ],
        relevanceScore: 0.95,
      });
    }

    if (!existingTypes.includes('AUTO') && profile.hasVehicle) {
      recommendations.push({
        type: 'AUTO',
        name: 'Comprehensive Auto Insurance',
        description: 'Complete protection for your vehicle',
        estimatedPremium: this.calculateAutoPremium(profile.vehicleValue || 500000),
        coverage: {
          ownDamage: 'Full vehicle value',
          thirdParty: 'Unlimited',
          personalAccident: '₹15,00,000',
          zeroDepreciation: 'Available',
        },
        benefits: [
          'Zero depreciation cover',
          '24x7 roadside assistance',
          'Engine protection',
          'Return to invoice cover',
        ],
        relevanceScore: 0.85,
      });
    }

    if (!existingTypes.includes('HOME') && profile.ownsHome) {
      recommendations.push({
        type: 'HOME',
        name: 'Home Insurance',
        description: 'Protect your home and belongings',
        estimatedPremium: this.calculateHomePremium(profile.homeValue || 5000000),
        coverage: {
          structure: 'Full rebuild value',
          contents: '₹10,00,000',
          liability: '₹5,00,000',
          naturalDisasters: 'Covered',
        },
        benefits: [
          'Coverage for fire, theft, and natural disasters',
          'Temporary accommodation expenses',
          'Personal liability protection',
          'Worldwide coverage for personal belongings',
        ],
        relevanceScore: 0.8,
      });
    }

    if (!existingTypes.includes('LIFE')) {
      const age = profile.age || 30;
      const hasFamily = profile.familySize > 1;

      recommendations.push({
        type: 'LIFE',
        name: hasFamily ? 'Term Life Insurance' : 'Life Insurance',
        description: 'Financial security for your loved ones',
        estimatedPremium: this.calculateLifePremium(age, profile.annualIncome || 600000),
        coverage: {
          sumAssured: '₹1,00,00,000',
          accidentalDeath: '₹2,00,00,000',
          criticalIllness: '₹25,00,000',
          terminalIllness: 'Covered',
        },
        benefits: [
          'High coverage at affordable premium',
          'Tax benefits under Section 80C and 10(10D)',
          'Flexible payout options',
          'Online policy management',
        ],
        relevanceScore: hasFamily ? 0.9 : 0.75,
      });
    }

    const sorted = recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    if (budget) {
      return sorted.filter((rec) => rec.estimatedPremium <= budget);
    }

    return sorted;
  }

  private calculateHealthPremium(age: number, hasFamily: boolean): number {
    let basePremium = 5000;

    if (age > 45) basePremium *= 2;
    else if (age > 35) basePremium *= 1.5;

    if (hasFamily) basePremium *= 2.5;

    return Math.round(basePremium);
  }

  private calculateAutoPremium(vehicleValue: number): number {
    return Math.round(vehicleValue * 0.03);
  }

  private calculateHomePremium(homeValue: number): number {
    return Math.round(homeValue * 0.007);
  }

  private calculateLifePremium(age: number, annualIncome: number): number {
    let basePremium = annualIncome * 0.01;

    if (age > 45) basePremium *= 1.8;
    else if (age > 35) basePremium *= 1.4;

    return Math.round(basePremium);
  }

  async getAvailablePolicies(filters?: { type?: string; minPrice?: number; maxPrice?: number }) {
    try {
      let query = db('available_policies').where({ is_active: true });

      if (filters?.type) {
        query = query.where({ type: filters.type });
      }

      if (filters?.minPrice) {
        query = query.where('base_premium', '>=', filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.where('base_premium', '<=', filters.maxPrice);
      }

      const policies = await query.orderBy('popularity_score', 'desc');

      return policies.map((policy: any) => ({
        policyTemplateId: policy.policy_template_id,
        name: policy.name,
        type: policy.type,
        description: policy.description,
        basePremium: Number(policy.base_premium),
        coverageDetails: this.parseCoverage(policy.coverage_details),
        features: this.parseCoverage(policy.features),
        eligibilityCriteria: this.parseCoverage(policy.eligibility_criteria),
        minAge: policy.min_age,
        maxAge: policy.max_age,
        minSumInsured: Number(policy.min_sum_insured),
        maxSumInsured: Number(policy.max_sum_insured),
        policyTermYears: policy.policy_term_years,
        providerName: policy.provider_name,
        popularityScore: policy.popularity_score,
      }));
    } catch (error) {
      console.error('Error fetching available policies:', error);
      throw error;
    }
  }

  async getAvailablePolicyById(policyTemplateId: string) {
    try {
      const policy = await db('available_policies')
        .where({ policy_template_id: policyTemplateId, is_active: true })
        .first();

      if (!policy) {
        throw new PolicyServiceError('Policy template not found', 404);
      }

      return {
        policyTemplateId: policy.policy_template_id,
        name: policy.name,
        type: policy.type,
        description: policy.description,
        basePremium: Number(policy.base_premium),
        coverageDetails: this.parseCoverage(policy.coverage_details),
        features: this.parseCoverage(policy.features),
        eligibilityCriteria: this.parseCoverage(policy.eligibility_criteria),
        minAge: policy.min_age,
        maxAge: policy.max_age,
        minSumInsured: Number(policy.min_sum_insured),
        maxSumInsured: Number(policy.max_sum_insured),
        policyTermYears: policy.policy_term_years,
        providerName: policy.provider_name,
        popularityScore: policy.popularity_score,
      };
    } catch (error) {
      console.error('Error fetching available policy:', error);
      throw error;
    }
  }

  async purchasePolicy(userId: string, policyTemplateId: string, paymentDetails: any) {
    try {
      // Get the policy template
      const template = await this.getAvailablePolicyById(policyTemplateId);

      // Validate user eligibility
      const user = await db('users').where({ user_id: userId }).first();
      if (!user) {
        throw new PolicyServiceError('User not found', 404);
      }

      const profile = JSON.parse(user.profile || '{}');
      const userAge = profile.age || 30;

      if (template.minAge && userAge < template.minAge) {
        throw new PolicyServiceError(`Minimum age requirement is ${template.minAge} years`, 400);
      }

      if (template.maxAge && userAge > template.maxAge) {
        throw new PolicyServiceError(`Maximum age limit is ${template.maxAge} years`, 400);
      }

      // Create the policy
      const policyNumber = this.generatePolicyNumber(template.type);
      const policyId = uuidv4();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + (template.policyTermYears || 1));

      // Add policy name and provider to coverage details
      const enrichedCoverage = {
        ...template.coverageDetails,
        policyName: template.name,
        providerName: template.providerName,
        policyTemplateId: policyTemplateId,
      };

      await db('policies').insert({
        policy_id: policyId,
        user_id: userId,
        policy_number: policyNumber,
        type: template.type,
        status: 'ACTIVE',
        premium: template.basePremium,
        coverage: JSON.stringify(enrichedCoverage),
        provider_id: uuidv4(),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create payment record
      const paymentId = uuidv4();
      const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db('payments').insert({
        payment_id: paymentId,
        user_id: userId,
        policy_id: policyId,
        transaction_ref: transactionRef,
        amount: template.basePremium,
        currency: 'INR',
        payment_method: paymentDetails.method || 'CARD',
        status: 'COMPLETED',
        description: `Policy purchase: ${template.name}`,
        created_at: new Date(),
      });

      // Update popularity score
      await db('available_policies')
        .where({ policy_template_id: policyTemplateId })
        .increment('popularity_score', 1);

      const policy = await db('policies').where({ policy_id: policyId }).first();

      console.log(`Policy purchased: ${policyId} by user ${userId}`);

      return {
        policy: this.mapPolicy(policy, true),
        payment: {
          paymentId,
          amount: template.basePremium,
          status: 'COMPLETED',
          transactionRef: transactionRef,
        },
      };
    } catch (error) {
      console.error('Error purchasing policy:', error);
      throw error;
    }
  }
}

export const policyService = new PolicyService();

// Made with Bob
