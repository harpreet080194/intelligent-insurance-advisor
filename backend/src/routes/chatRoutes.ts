import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { chatController } from '../controllers/chatController';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Chat session management
router.post('/sessions', chatController.createChatSession.bind(chatController));
router.get('/sessions', chatController.getUserChatSessions.bind(chatController));
router.get('/sessions/:sessionId', chatController.getChatSession.bind(chatController));
router.patch('/sessions/:sessionId/end', chatController.endChatSession.bind(chatController));

// Send message
router.post('/sessions/:sessionId/messages', chatController.sendMessage.bind(chatController));

// Suggested questions
router.get('/suggestions', chatController.getSuggestedQuestions.bind(chatController));

export default router;

// Made with Bob
