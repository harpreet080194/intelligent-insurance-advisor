import type { Response, NextFunction } from 'express';
import { chatService } from '../services/chatService';
import type { AuthRequest } from '../middleware/auth';

export class ChatController {
  async createChatSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const initialMessage = req.body?.initialMessage;

      const session = await chatService.createChatSession({
        userId,
        initialMessage,
      });

      res.status(201).json({
        success: true,
        message: 'Chat session created',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params?.sessionId;
      const rawMessage = req.body?.message;
      const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';

      if (!message) {
        throw new Error('Message is required');
      }

      const response = await chatService.sendMessage({
        sessionId,
        userId,
        message,
      });

      res.setHeader('X-Chat-Model-Debug', 'gpt-4o-mini-src');
      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getChatSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params?.sessionId;
      const session = await chatService.getChatSession(sessionId, userId);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserChatSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const sessions = await chatService.getUserChatSessions(userId);

      res.json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async endChatSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params?.sessionId;
      const result = await chatService.endChatSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Chat session ended',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuggestedQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const suggestions = await chatService.getSuggestedQuestions(userId);

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
