const { v4: uuidv4 } = require('uuid');
const db = require('../config/database').default || require('../config/database');

interface PaymentData {
  userId: string;
  policyId?: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  description?: string;
}

interface PaymentMethodData {
  userId: string;
  type: 'card' | 'bank_account';
  token: string;
  isDefault?: boolean;
}

export class PaymentService {
  private getStripeClient() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return null;
    }

    try {
      const Stripe = require('stripe');
      return new Stripe(stripeKey);
    } catch {
      return null;
    }
  }

  async processPayment(data: PaymentData) {
    const trx = await db.transaction();

    try {
      if (!data.amount || data.amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      if (data.policyId) {
        const policy = await trx('policies')
          .where({ policy_id: data.policyId, user_id: data.userId })
          .first();

        if (!policy) {
          throw new Error('Policy not found');
        }
      }

      const stripe = this.getStripeClient();
      const transactionRef = this.generateTransactionRef();
      let stripePaymentIntentId: string | null = null;
      let status = 'COMPLETED';

      if (stripe) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(data.amount * 100),
          currency: String(data.currency || 'usd').toLowerCase(),
          payment_method: data.paymentMethodId,
          confirm: true,
          description: data.description || 'Insurance premium payment',
          metadata: {
            userId: data.userId,
            policyId: data.policyId || '',
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        });

        stripePaymentIntentId = paymentIntent.id;
        status = paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING';
      }

      const paymentId = uuidv4();

      await trx('payments').insert({
        payment_id: paymentId,
        user_id: data.userId,
        policy_id: data.policyId || null,
        transaction_ref: transactionRef,
        amount: data.amount,
        currency: data.currency,
        payment_method: stripe ? 'stripe' : 'manual',
        stripe_payment_intent_id: stripePaymentIntentId,
        status,
        description: data.description || null,
        created_at: new Date(),
      });

      const payment = await trx('payments')
        .where({ payment_id: paymentId })
        .first();

      await trx.commit();

      return {
        paymentId: payment.payment_id,
        transactionRef: payment.transaction_ref,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        stripePaymentIntentId,
        createdAt: payment.created_at,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getPaymentById(paymentId: string, userId: string) {
    const payment = await db('payments')
      .where({ payment_id: paymentId, user_id: userId })
      .first();

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      paymentId: payment.payment_id,
      transactionRef: payment.transaction_ref,
      policyId: payment.policy_id,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      status: payment.status,
      description: payment.description,
      createdAt: payment.created_at,
    };
  }

  async getPaymentHistory(userId: string, filters?: { policyId?: string; status?: string }) {
    let query = db('payments')
      .where({ 'payments.user_id': userId })
      .leftJoin('policies', 'payments.policy_id', 'policies.policy_id')
      .select('payments.*', 'policies.policy_number', 'policies.type as policy_type');

    if (filters?.policyId) {
      query = query.where('payments.policy_id', filters.policyId);
    }

    if (filters?.status) {
      query = query.where('payments.status', filters.status);
    }

    const payments = await query.orderBy('payments.created_at', 'desc');

    return payments.map((payment: any) => ({
      paymentId: payment.payment_id,
      transactionRef: payment.transaction_ref,
      policyId: payment.policy_id,
      policyNumber: payment.policy_number,
      policyType: payment.policy_type,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.created_at,
    }));
  }

  async addPaymentMethod(data: PaymentMethodData) {
    if (data.isDefault) {
      await db('payment_methods')
        .where({ user_id: data.userId })
        .update({ is_default: false });
    }

    const paymentMethodId = uuidv4();
    const stripe = this.getStripeClient();

    let stripePaymentMethodId: string | null = null;
    let lastFour: string | null = null;
    let brand: string | null = null;
    const expMonth: number | null = null;
    const expYear: number | null = null;

    if (stripe) {
      stripePaymentMethodId = data.token;
    } else {
      lastFour = String(data.token || '').slice(-4) || null;
      brand = data.type === 'card' ? 'manual' : 'bank';
    }

    await db('payment_methods').insert({
      payment_method_id: paymentMethodId,
      user_id: data.userId,
      stripe_payment_method_id: stripePaymentMethodId,
      type: data.type,
      last_four: lastFour,
      brand,
      exp_month: expMonth,
      exp_year: expYear,
      is_default: Boolean(data.isDefault),
      created_at: new Date(),
    });

    const savedMethod = await db('payment_methods')
      .where({ payment_method_id: paymentMethodId })
      .first();

    return {
      paymentMethodId: savedMethod.payment_method_id,
      type: savedMethod.type,
      lastFour: savedMethod.last_four,
      brand: savedMethod.brand,
      isDefault: savedMethod.is_default,
    };
  }

  async getPaymentMethods(userId: string) {
    const methods = await db('payment_methods')
      .where({ user_id: userId })
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc');

    return methods.map((method: any) => ({
      paymentMethodId: method.payment_method_id,
      type: method.type,
      lastFour: method.last_four,
      brand: method.brand,
      expMonth: method.exp_month,
      expYear: method.exp_year,
      isDefault: method.is_default,
      createdAt: method.created_at,
    }));
  }

  async removePaymentMethod(paymentMethodId: string, userId: string) {
    const method = await db('payment_methods')
      .where({ payment_method_id: paymentMethodId, user_id: userId })
      .first();

    if (!method) {
      throw new Error('Payment method not found');
    }

    await db('payment_methods')
      .where({ payment_method_id: paymentMethodId })
      .delete();

    return { success: true };
  }

  async setDefaultPaymentMethod(paymentMethodId: string, userId: string) {
    const method = await db('payment_methods')
      .where({ payment_method_id: paymentMethodId, user_id: userId })
      .first();

    if (!method) {
      throw new Error('Payment method not found');
    }

    await db('payment_methods')
      .where({ user_id: userId })
      .update({ is_default: false });

    await db('payment_methods')
      .where({ payment_method_id: paymentMethodId })
      .update({ is_default: true });

    return { success: true };
  }

  async generateReceipt(paymentId: string, userId: string) {
    const payment = await this.getPaymentById(paymentId, userId);

    return {
      receiptNumber: `RCP-${payment.transactionRef}`,
      paymentId: payment.paymentId,
      transactionRef: payment.transactionRef,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.createdAt,
      description: payment.description,
    };
  }

  private generateTransactionRef() {
    const prefix = 'TXN';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }
}

export const paymentService = new PaymentService();

// Made with Bob
