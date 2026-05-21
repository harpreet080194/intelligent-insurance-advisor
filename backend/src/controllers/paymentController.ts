import type { Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';
import type { AuthRequest } from '../middleware/auth';

type PaymentFilters = {
  policyId?: string;
  status?: string;
};

export class PaymentController {
  async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { policyId, amount, currency, paymentMethodId, description } = req.body || {};

      if (!amount || !currency || !paymentMethodId) {
        throw new Error('Amount, currency, and payment method ID are required');
      }

      const payment = await paymentService.processPayment({
        userId,
        policyId,
        amount: Number(amount),
        currency,
        paymentMethodId,
        description,
      });

      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const paymentId = req.params?.paymentId;
      const payment = await paymentService.getPaymentById(paymentId, userId);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const query = (req.query || {}) as { policyId?: unknown; status?: unknown };
      const filters: PaymentFilters = {};

      if (typeof query.policyId === 'string') {
        filters.policyId = query.policyId;
      }

      if (typeof query.status === 'string') {
        filters.status = query.status;
      }

      const payments = await paymentService.getPaymentHistory(userId, filters);

      res.json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async addPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { type, token, isDefault } = req.body || {};

      if (!type || !token) {
        throw new Error('Type and token are required');
      }

      if (!['card', 'bank_account'].includes(type)) {
        throw new Error('Invalid payment method type');
      }

      const paymentMethod = await paymentService.addPaymentMethod({
        userId,
        type,
        token,
        isDefault: Boolean(isDefault),
      });

      res.status(201).json({
        success: true,
        message: 'Payment method added successfully',
        data: paymentMethod,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const methods = await paymentService.getPaymentMethods(userId);

      res.json({
        success: true,
        count: methods.length,
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  }

  async removePaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const paymentMethodId = req.params?.paymentMethodId;

      await paymentService.removePaymentMethod(paymentMethodId, userId);

      res.json({
        success: true,
        message: 'Payment method removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const paymentMethodId = req.params?.paymentMethodId;

      await paymentService.setDefaultPaymentMethod(paymentMethodId, userId);

      res.json({
        success: true,
        message: 'Default payment method updated',
      });
    } catch (error) {
      next(error);
    }
  }

  async generateReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const paymentId = req.params?.paymentId;
      const receipt = await paymentService.generateReceipt(paymentId, userId);

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();

// Made with Bob
