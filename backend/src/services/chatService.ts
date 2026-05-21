interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSessionData {
  userId: string;
  initialMessage?: string;
}

interface SendMessageData {
  sessionId: string;
  userId: string;
  message: string;
}

export class ChatService {
  private getDatabase() {
    const databaseModule = require('../config/database');
    return databaseModule.default || databaseModule;
  }

  private newId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private getSystemPrompt() {
    return `You are an intelligent insurance advisor assistant. Your role is to:
1. Help users understand insurance policies (Health, Auto, Home, Life)
2. Answer questions about claims processing
3. Provide guidance on policy selection
4. Explain insurance terms and coverage details
5. Assist with premium calculations and payment queries

Guidelines:
- Be professional, friendly, and empathetic
- Provide accurate information about insurance products
- If you don't know something, admit it and suggest contacting support
- Keep responses concise but informative
- Use simple language, avoid jargon when possible
- Always prioritize user's best interests

You have access to the user's policy and claim information when needed.`;
  }

  async createChatSession(data: ChatSessionData) {
    const database = this.getDatabase();
    const sessionId = this.newId();

    await database('chat_sessions').insert({
      session_id: sessionId,
      user_id: data.userId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const session = await database('chat_sessions')
      .where({ session_id: sessionId })
      .first();

    if (data.initialMessage) {
      const response = await this.sendMessage({
        sessionId: session.session_id,
        userId: data.userId,
        message: data.initialMessage,
      });

      return {
        sessionId: session.session_id,
        status: session.status,
        createdAt: session.created_at,
        initialResponse: response,
      };
    }

    return {
      sessionId: session.session_id,
      status: session.status,
      createdAt: session.created_at,
    };
  }

  async sendMessage(data: SendMessageData) {
    const database = this.getDatabase();
    const trx = await database.transaction();

    try {
      const session = await trx('chat_sessions')
        .where({ session_id: data.sessionId, user_id: data.userId })
        .first();

      if (!session) {
        throw new Error('Chat session not found');
      }

      if (session.status !== 'ACTIVE') {
        throw new Error('Chat session is not active');
      }

      await trx('chat_messages').insert({
        message_id: this.newId(),
        session_id: data.sessionId,
        role: 'user',
        content: data.message,
        created_at: new Date(),
      });

      const history = await this.getConversationHistory(trx, data.sessionId);
      const userContext = await this.getUserContext(trx, data.userId);
      const assistantMessage = await this.generateAssistantResponse(history, userContext, data.message);

      await trx('chat_messages').insert({
        message_id: this.newId(),
        session_id: data.sessionId,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date(),
      });

      await trx('chat_sessions')
        .where({ session_id: data.sessionId })
        .update({ updated_at: new Date() });

      await trx.commit();

      return {
        message: assistantMessage,
        timestamp: new Date(),
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getChatSession(sessionId: string, userId: string) {
    const database = this.getDatabase();
    const session = await database('chat_sessions')
      .where({ session_id: sessionId, user_id: userId })
      .first();

    if (!session) {
      throw new Error('Chat session not found');
    }

    const messages = await database('chat_messages')
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc');

    return {
      sessionId: session.session_id,
      status: session.status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: messages.map((msg: any) => ({
        messageId: msg.message_id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    };
  }

  async getUserChatSessions(userId: string) {
    const database = this.getDatabase();
    const sessions = await database('chat_sessions')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc');

    return sessions.map((session: any) => ({
      sessionId: session.session_id,
      status: session.status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }));
  }

  async endChatSession(sessionId: string, userId: string) {
    const database = this.getDatabase();

    await database('chat_sessions')
      .where({ session_id: sessionId, user_id: userId })
      .update({
        status: 'ENDED',
        updated_at: new Date(),
      });

    const session = await database('chat_sessions')
      .where({ session_id: sessionId, user_id: userId })
      .first();

    if (!session) {
      throw new Error('Chat session not found');
    }

    return {
      sessionId: session.session_id,
      status: session.status,
    };
  }

  async getSuggestedQuestions(userId: string) {
    const database = this.getDatabase();

    const policies = await database('policies')
      .where({ user_id: userId, status: 'ACTIVE' })
      .select('type');

    const hasClaims = await database('claims')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    const suggestions = [
      'What types of insurance do you offer?',
      'How do I file a claim?',
      'What is covered under my policy?',
    ];

    if (policies.length === 0) {
      suggestions.push('Which insurance policy is right for me?');
      suggestions.push('How much does health insurance cost?');
    }

    if (policies.length > 0) {
      suggestions.push('Can I increase my coverage?');
      suggestions.push('When is my premium due?');
    }

    if (Number((hasClaims as any)?.count || 0) > 0) {
      suggestions.push('What is the status of my claim?');
    }

    return suggestions;
  }

  private async getConversationHistory(trx: any, sessionId: string): Promise<ChatMessage[]> {
    const messages = await trx('chat_messages')
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc')
      .limit(20);

    return messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  private async getUserContext(trx: any, userId: string) {
    const policies = await trx('policies')
      .where({ user_id: userId, status: 'ACTIVE' })
      .select('type', 'policy_number', 'premium');

    const claims = await trx('claims')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('claim_number', 'type', 'status', 'amount');

    return { policies, claims };
  }

  private buildSystemPromptWithContext(context: any) {
    let prompt = this.getSystemPrompt();

    if (context.policies.length > 0) {
      prompt += '\n\nUser\'s Active Policies:\n';
      context.policies.forEach((policy: any) => {
        prompt += `- ${policy.type} Insurance (${policy.policy_number}): ₹${policy.premium}/year\n`;
      });
    }

    if (context.claims.length > 0) {
      prompt += '\n\nUser\'s Recent Claims:\n';
      context.claims.forEach((claim: any) => {
        prompt += `- ${claim.claim_number}: ${claim.type} - ${claim.status} (₹${claim.amount})\n`;
      });
    }

    return prompt;
  }

  private async generateAssistantResponse(history: ChatMessage[], userContext: any, message: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    const useMockResponse = process.env.USE_MOCK_AI === 'true';

    // Use mock responses if enabled or if no API key
    if (useMockResponse || !apiKey) {
      return this.generateMockResponse(message, userContext);
    }

    try {
      const OpenAIClient = require('openai');
      const client = new OpenAIClient({ apiKey });

      const messages: ChatMessage[] = [
        { role: 'system', content: this.buildSystemPromptWithContext(userContext) },
        ...history,
        { role: 'user', content: message },
      ];

      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
      });

      return completion?.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error: any) {
      // If quota exceeded or other API error, fall back to mock response
      if (error?.status === 429 || error?.message?.includes('quota')) {
        console.warn('OpenAI quota exceeded, using mock response. Set USE_MOCK_AI=true in .env to avoid API calls.');
        return this.generateMockResponse(message, userContext);
      }
      throw error;
    }
  }

  private generateMockResponse(message: string, userContext: any): string {
    const lowerMessage = message.toLowerCase();

    // Policy-related questions
    if (lowerMessage.includes('policy') || lowerMessage.includes('policies')) {
      if (userContext.policies.length > 0) {
        const policyTypes = userContext.policies.map((p: any) => p.type).join(', ');
        return `I can see you have ${userContext.policies.length} active ${userContext.policies.length === 1 ? 'policy' : 'policies'}: ${policyTypes}. How can I help you with your insurance coverage today?`;
      }
      return 'We offer various insurance policies including Health, Auto, Home, and Life insurance. Each policy is designed to provide comprehensive coverage tailored to your needs. Would you like to know more about a specific type?';
    }

    // Claim-related questions
    if (lowerMessage.includes('claim')) {
      if (userContext.claims.length > 0) {
        const latestClaim = userContext.claims[0];
        return `I can see your recent claim (${latestClaim.claim_number}) for ${latestClaim.type} insurance with status: ${latestClaim.status}. The claim amount is ₹${latestClaim.amount}. Would you like more details about this claim?`;
      }
      return 'To file a claim, please go to the Claims section and click "Submit New Claim". You\'ll need to provide details about the incident and upload any supporting documents. Our team typically processes claims within 5-7 business days.';
    }

    // Premium/payment questions
    if (lowerMessage.includes('premium') || lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      return 'You can view and pay your premiums in the Payments section. We accept various payment methods including credit/debit cards, net banking, and UPI. You can also set up auto-pay for hassle-free premium payments.';
    }

    // Coverage questions
    if (lowerMessage.includes('coverage') || lowerMessage.includes('cover')) {
      return 'Our insurance policies provide comprehensive coverage. For specific coverage details, please check your policy documents in the Policies section. Each policy type has different coverage limits and exclusions. Would you like me to explain coverage for a specific policy type?';
    }

    // General greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! I\'m your insurance advisor assistant. I can help you with questions about your policies, claims, premiums, and coverage. How can I assist you today?';
    }

    // Default response
    return `Thank you for your question about "${message}". I'm here to help with your insurance needs. You can ask me about:
- Your active policies and coverage
- Filing or checking claim status
- Premium payments and due dates
- Understanding insurance terms
- Choosing the right policy

What would you like to know more about?`;
  }
}

export const chatService = new ChatService();

// Made with Bob
