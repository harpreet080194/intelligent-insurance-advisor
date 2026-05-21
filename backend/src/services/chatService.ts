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
      // Always fall back to mock response on any error (quota, missing package, network issues, etc.)
      console.warn('OpenAI API error, using mock response:', error?.message || 'Unknown error');
      console.warn('Set USE_MOCK_AI=true in .env to avoid API calls and use mock responses directly.');
      return this.generateMockResponse(message, userContext);
    }
  }

  private generateMockResponse(message: string, userContext: any): string {
    const lowerMessage = message.toLowerCase();
    
    // Extract key information from message
    const hasFamily = /family|member|4|four|wife|husband|child|kid|parent|spouse/.test(lowerMessage);
    const hasHealth = /health|medical|hospital|doctor|treatment|medicine/.test(lowerMessage);
    const hasClaim = /claim|file|submit|reimburs/.test(lowerMessage);
    const hasBuy = /buy|purchase|get|need|want|looking/.test(lowerMessage);
    const hasHowTo = /how to|how do|how can/.test(lowerMessage);
    const hasCompare = /difference|compare|vs|versus|better|which one/.test(lowerMessage);
    const hasFloater = /floater|individual|separate|single/.test(lowerMessage);
    const hasNumber = lowerMessage.match(/\b([2-9]|10)\b/); // Extract family size

    // Health insurance for family
    if ((hasHealth || lowerMessage.includes('insurance')) && hasFamily) {
      const familySize = hasNumber ? hasNumber[1] : '4';
      return `For a family of ${familySize}, I recommend a **Family Floater Health Plan**:\n\n**What is a Family Floater?**\n- Single policy covering entire family\n- Shared sum insured (e.g., ₹5L-10L for all members)\n- More affordable than individual policies\n- Any family member can use the full coverage\n\n**Individual vs Family Floater:**\n- **Individual**: Separate coverage per person (₹5L each = ₹20L total)\n- **Family Floater**: Shared coverage (₹10L for all ${familySize} members)\n- Family floater costs 40-50% less!\n\n**Recommended Plans:**\n- Family Health Plus: ₹18,500/year (₹5L coverage)\n- Premium Family Care: ₹28,000/year (₹10L coverage)\n\nCheck "Available Policies" tab to compare and purchase!`;
    }

    // Health insurance general
    if (hasHealth || lowerMessage.includes('health insurance') || lowerMessage.includes('medical insurance')) {
      return `**Health Insurance Options:**\n\n🏥 **Individual Plans** - ₹4,800-₹15,000/year\n👨‍👩‍👧‍👦 **Family Floater** - ₹18,500-₹32,000/year\n👴 **Senior Citizen** - ₹24,500/year\n💼 **Young Professional** - ₹6,500/year\n\nFor families, a Family Floater plan is most cost-effective! Visit "Available Policies" to explore options.`;
    }

    // Difference/comparison questions
    if (hasCompare || lowerMessage.includes('difference') || lowerMessage.includes('compare') || lowerMessage.includes('vs')) {
      if (hasFloater || (lowerMessage.includes('individual') && lowerMessage.includes('family'))) {
        return `**Individual vs Family Floater Health Plans:**\n\n**Individual Health Plan:**\n✅ Separate policy for each person\n✅ Dedicated sum insured per member\n✅ Better for families with elderly members\n❌ More expensive overall\n\n**Family Floater Plan:**\n✅ Single policy for entire family\n✅ Shared sum insured pool\n✅ 40-50% cheaper than individual plans\n✅ Easy to manage - one policy, one premium\n❌ Coverage shared among all members\n\n**Example for Family of 4:**\n- Individual: 4 × ₹8,000 = ₹32,000/year\n- Family Floater: ₹18,500/year (Save ₹13,500!)\n\n**Best Choice:** Family Floater for young families, Individual for families with seniors or high medical needs.\n\nExplore options in "Available Policies" tab!`;
      }
      return `I can help you compare insurance options! What would you like to compare?\n\n- Individual vs Family health plans\n- Term vs Whole life insurance\n- Third-party vs Comprehensive auto insurance\n- Different coverage amounts\n\nJust ask!`;
    }

    // Policy recommendation questions
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('which policy') || lowerMessage.includes('best policy') || lowerMessage.includes('should i buy') || lowerMessage.includes('what policy')) {
      const existingTypes = userContext.policies.map((p: any) => p.type);
      const recommendations = [];

      if (!existingTypes.includes('HEALTH')) {
        recommendations.push('**Health Insurance** - Essential for medical emergencies. Based on your profile, I recommend a family floater plan starting at ₹18,500/year with ₹5L coverage.');
      }
      if (!existingTypes.includes('LIFE')) {
        recommendations.push('**Life Insurance** - Secure your family\'s future. A term plan with ₹50L-1Cr coverage starting at ₹11,800/year would be ideal.');
      }
      if (!existingTypes.includes('AUTO')) {
        recommendations.push('**Auto Insurance** - Protect your vehicle. Comprehensive coverage with zero depreciation starting at ₹18,500/year.');
      }
      if (!existingTypes.includes('HOME')) {
        recommendations.push('**Home Insurance** - Safeguard your property. Coverage for fire, theft, and natural disasters starting at ₹15,000/year.');
      }

      if (recommendations.length > 0) {
        return `Based on your needs, I recommend:\n\n${recommendations.join('\n\n')}\n\nVisit the "Available Policies" tab to explore these options and purchase directly!`;
      }
      
      // If user has all types but still asking for suggestions, show them upgrade/additional options
      return `Great! You have coverage across all major insurance types. Here are ways to enhance your protection:\n\n**Upgrade Options:**\n🏥 **Health** - Increase coverage to ₹10L-20L for better protection\n🚗 **Auto** - Add zero depreciation or roadside assistance\n🏠 **Home** - Extend coverage for valuables and electronics\n❤️ **Life** - Increase sum assured for growing family needs\n\n**Additional Coverage:**\n- Critical Illness Rider (₹5,000/year)\n- Personal Accident Cover (₹3,500/year)\n- Travel Insurance (₹2,500/year)\n\nVisit "Available Policies" tab to explore 40+ options and upgrade your coverage!`;
    }

    // Budget-based questions
    if (lowerMessage.includes('budget') || lowerMessage.includes('afford') || lowerMessage.includes('cheap') || lowerMessage.includes('low cost') || lowerMessage.includes('price')) {
      return `I can help you find affordable policies! Here are budget-friendly options:\n\n**Health**: Super Saver Health at ₹4,800/year\n**Auto**: Third Party Car Insurance at ₹2,200/year\n**Home**: Fire and Allied Perils at ₹3,500/year\n**Life**: Term Life Basic at ₹11,800/year\n\nCheck the "Available Policies" tab and filter by price to see all options within your budget!`;
    }

    // Age-based questions
    if (lowerMessage.includes('age') || lowerMessage.includes('senior') || lowerMessage.includes('young') || lowerMessage.includes('old') || lowerMessage.includes('elderly')) {
      if (lowerMessage.includes('senior') || lowerMessage.includes('60') || lowerMessage.includes('old') || lowerMessage.includes('elderly')) {
        return 'For senior citizens, I recommend:\n\n**Senior Citizen Care** - Specialized health plan covering age-related ailments at ₹24,500/year\n**Senior Life Cover** - Life insurance up to age 75 at ₹55,000/year\n\nThese policies have no waiting period for pre-existing conditions!';
      }
      return 'For young professionals, I recommend:\n\n**Young Professional Health** - Affordable health coverage at ₹6,500/year\n**Term Life Basic** - High coverage at low premium starting ₹11,800/year\n\nStart early to lock in lower premiums!';
    }

    // Claim-related questions - Check FIRST before "how to" questions
    if (hasClaim || lowerMessage.includes('claim')) {
      if (userContext.claims.length > 0) {
        const latestClaim = userContext.claims[0];
        return `I can see your recent claim (${latestClaim.claim_number}) for ${latestClaim.type} insurance with status: ${latestClaim.status}. The claim amount is ₹${latestClaim.amount}.\n\nWould you like more details about this claim?`;
      }
      return `**How to File a Claim:**\n\n1️⃣ **Go to Claims Section**\n   - Click "Claims" in navigation menu\n   - Click "Submit New Claim" button\n\n2️⃣ **Select Policy**\n   - Choose the policy to claim against\n   - Verify policy is active\n\n3️⃣ **Provide Details**\n   - Incident date and description\n   - Claim amount\n   - Upload supporting documents (bills, reports, photos)\n\n4️⃣ **Submit & Track**\n   - Review and submit claim\n   - Track status in Claims section\n   - Get updates via email\n\n⏱️ **Processing Time:** 5-7 business days\n💰 **Settlement:** Direct bank transfer\n\n📞 **Need Help?** Contact support for claim assistance!`;
    }

    // Purchase/buy questions - Check AFTER claim questions
    if ((hasHowTo && hasBuy) || hasBuy || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      // If asking about buying for family
      if (hasFamily) {
        return `**How to Buy Insurance for Your Family:**\n\n1️⃣ **Choose Policy Type**\n   - For families: Health (Family Floater recommended)\n   - Also consider: Life, Home insurance\n\n2️⃣ **Browse Options**\n   - Go to "Available Policies" tab\n   - Filter by "HEALTH" type\n   - Look for "Family" plans\n\n3️⃣ **Select Coverage**\n   - Family of 4: Minimum ₹5L coverage\n   - Recommended: ₹10L for better protection\n\n4️⃣ **Purchase**\n   - Click "Purchase Now"\n   - Use demo card: 4242 4242 4242 4242\n   - Any future date, any CVV\n\n5️⃣ **Instant Activation**\n   - Policy active immediately\n   - View in "My Policies" tab\n\n💡 **Recommended:** Family Health Plus (₹18,500/year) or Premium Family Care (₹28,000/year)`;
      }
      return `**How to Purchase a Policy:**\n\n1️⃣ **Browse Policies**\n   - Go to "Available Policies" tab\n   - View 40+ policies across 4 categories\n\n2️⃣ **Filter & Compare**\n   - Use filters (type, price, coverage)\n   - Compare features and benefits\n\n3️⃣ **Select & Purchase**\n   - Click "Purchase Now" on chosen policy\n   - Review policy details\n\n4️⃣ **Complete Payment**\n   - Use demo card: 4242 4242 4242 4242\n   - Any future date, any CVV\n\n5️⃣ **Instant Activation**\n   - Policy activates immediately\n   - View in "My Policies" tab\n\n💡 **Need help choosing?** Ask me "Which policy should I buy?" for personalized recommendations!`;
    }

    // Policy-related questions
    if (lowerMessage.includes('policy') || lowerMessage.includes('policies') || lowerMessage.includes('insurance')) {
      if (userContext.policies.length > 0) {
        const policyTypes = userContext.policies.map((p: any) => p.type).join(', ');
        return `I can see you have ${userContext.policies.length} active ${userContext.policies.length === 1 ? 'policy' : 'policies'}: ${policyTypes}.\n\nWould you like recommendations for additional coverage? Or check the "Available Policies" tab to browse 40+ options!`;
      }
      return 'We offer 40+ insurance policies across 4 categories:\n\n🏥 **Health** - 13 plans (₹2,500-₹32,000/year)\n🚗 **Auto** - 10 plans (₹1,500-₹48,000/year)\n🏠 **Home** - 10 plans (₹2,500-₹35,000/year)\n❤️ **Life** - 10 plans (₹11,800-₹55,000/year)\n\nVisit "Available Policies" to explore and purchase!';
    }

    // Premium/payment questions
    if (lowerMessage.includes('premium') || lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('due')) {
      return `**Premium & Payments:**\n\n💳 **View Premiums**\n   - Go to "Payments" section\n   - See all due and paid premiums\n\n💰 **Payment Methods**\n   - Credit/Debit Cards\n   - Net Banking\n   - UPI\n   - Demo card: 4242 4242 4242 4242\n\n🔄 **Auto-Pay**\n   - Set up automatic payments\n   - Never miss a premium\n\n📅 **Due Dates**\n   - Check payment schedule\n   - Get reminders\n\nVisit "Payments" tab to manage your premiums!`;
    }

    // Coverage questions
    if (lowerMessage.includes('coverage') || lowerMessage.includes('cover') || lowerMessage.includes('what does') || lowerMessage.includes('include')) {
      return `**Insurance Coverage Information:**\n\n🏥 **Health Insurance Covers:**\n   - Hospitalization expenses\n   - Pre & post hospitalization\n   - Daycare procedures\n   - Ambulance charges\n\n🚗 **Auto Insurance Covers:**\n   - Own damage\n   - Third-party liability\n   - Personal accident\n   - Zero depreciation (comprehensive)\n\n🏠 **Home Insurance Covers:**\n   - Fire & allied perils\n   - Theft & burglary\n   - Natural disasters\n   - Contents & structure\n\n❤️ **Life Insurance Covers:**\n   - Death benefit\n   - Terminal illness\n   - Accidental death benefit\n\n📄 For specific policy details, check "My Policies" or "Available Policies" tab!`;
    }

    // General greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good evening')) {
      return `Hello! 👋 I'm your insurance advisor assistant.\n\n**I can help you with:**\n\n🔍 **Find Policies** - "Show me health insurance"\n💡 **Get Recommendations** - "Which policy for family of 4?"\n🛒 **Purchase Guide** - "How to buy a policy?"\n📋 **File Claims** - "How to claim?"\n💰 **Check Premiums** - "When is payment due?"\n📊 **Coverage Info** - "What does health insurance cover?"\n\n**Quick Actions:**\n- Browse 40+ policies in "Available Policies" tab\n- View your policies in "My Policies" tab\n- File claims in "Claims" section\n\nWhat would you like to know?`;
    }

    // Thank you / feedback
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('great') || lowerMessage.includes('perfect')) {
      return `You're welcome! 😊\n\nI'm here to help anytime. Feel free to ask:\n- Policy recommendations\n- Coverage questions\n- Purchase guidance\n- Claim assistance\n\nHappy to assist you with your insurance needs!`;
    }

    // Default response for unrecognized questions
    return `I'd be happy to help! Here's what I can assist you with:\n\n**Popular Questions:**\n\n🏥 **Health Insurance**\n   - "I need health insurance for my family"\n   - "What's the difference between individual and family floater?"\n\n💰 **Buying Policies**\n   - "How do I buy a policy?"\n   - "Which policy should I buy?"\n   - "Show me affordable options"\n\n📋 **Claims & Payments**\n   - "How to file a claim?"\n   - "When is my premium due?"\n\n📊 **Coverage Details**\n   - "What does health insurance cover?"\n   - "Compare auto insurance plans"\n\n**Quick Access:**\n- 🔍 Browse 40+ policies in "Available Policies" tab\n- 📄 View your policies in "My Policies" tab\n- 💳 Manage payments in "Payments" section\n\nJust ask your question naturally, and I'll help you!`;
  }
}

export const chatService = new ChatService();

// Made with Bob
