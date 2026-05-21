import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import knex from 'knex';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3001' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await db('users').insert({
      user_id: userId,
      email,
      password_hash: passwordHash,
      profile: JSON.stringify({ firstName, lastName, phone }),
      preferences: JSON.stringify({}),
      email_verified: false,
      mfa_enabled: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Generate token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as any
    );

    const refreshToken = jwt.sign(
      { userId, email },
      process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          userId,
          email,
          profile: { firstName, lastName, phone },
          mfaEnabled: false,
          emailVerified: false
        },
        token,
        refreshToken
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as any
    );

    const refreshToken = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any
    );

    // Update last login
    await db('users')
      .where({ user_id: user.user_id })
      .update({ last_login_at: new Date().toISOString() });

    const profile = user.profile ? JSON.parse(user.profile) : {};

    res.json({
      success: true,
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          profile,
          mfaEnabled: user.mfa_enabled,
          emailVerified: user.email_verified
        },
        token,
        refreshToken
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Simple auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req: any, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // For enhanced security, you could implement token blacklisting with Redis
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Get user policies
app.get('/api/policies', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const policies = await db('policies').where({ user_id: userId }).select('*');
    
    res.json({
      success: true,
      count: policies.length,
      data: policies
    });
  } catch (error: any) {
    console.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies',
      error: error.message
    });
  }
});

// Create a policy (for testing)
app.post('/api/policies', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { type, policyNumber, premium, coverage, status, providerId } = req.body;

    if (!type || !policyNumber || !premium || !coverage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const policyId = uuidv4();
    const providerIdToUse = providerId || uuidv4(); // Generate a provider ID if not provided
    
    await db('policies').insert({
      policy_id: policyId,
      user_id: userId,
      type,
      policy_number: policyNumber,
      provider_id: providerIdToUse,
      premium,
      coverage: JSON.stringify(coverage),
      status: status || 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const policy = await db('policies').where({ policy_id: policyId }).first();

    res.status(201).json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    console.error('Create policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create policy',
      error: error.message
    });
  }
});

// Get policy recommendations
app.get('/api/policies/recommendations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    // Mock recommendations - in production, this would use AI/ML
    const recommendations = [
      {
        id: uuidv4(),
        type: 'Health',
        providerName: 'HealthGuard Plus',
        premium: 220,
        coverage: {
          coverageAmount: 750000,
          deductible: 1500
        },
        score: 95,
        reasons: [
          'Comprehensive coverage for your age group',
          'Lower deductible than your current plan',
          'Includes dental and vision',
          'Highly rated provider in your area'
        ]
      },
      {
        id: uuidv4(),
        type: 'Auto',
        providerName: 'SafeDrive Insurance',
        premium: 160,
        coverage: {
          coverageAmount: 150000,
          deductible: 750
        },
        score: 92,
        reasons: [
          'Better coverage at lower cost',
          'Accident forgiveness included',
          'Roadside assistance 24/7',
          'Good driver discount available'
        ]
      },
      {
        id: uuidv4(),
        type: 'Life',
        providerName: 'LifeSecure Pro',
        premium: 95,
        coverage: {
          coverageAmount: 1500000,
          deductible: 0
        },
        score: 90,
        reasons: [
          'Higher coverage amount',
          'Lower monthly premium',
          'No medical exam required',
          'Flexible beneficiary options'
        ]
      }
    ];
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

// Get user claims
app.get('/api/claims', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;
    
    let query = db('claims').where({ user_id: userId });
    
    if (status) {
      const statuses = status.split(',');
      query = query.whereIn('status', statuses);
    }
    
    const claims = await query.select('*');
    
    res.json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error: any) {
    console.error('Get claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claims',
      error: error.message
    });
  }
});

// Get user payments
app.get('/api/payments', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;
    
    let query = db('payments').where({ user_id: userId });
    
    if (status) {
      query = query.where({ status });
    }
    
    const payments = await query.select('*');
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error: any) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Chat endpoints
app.post('/api/chat/session', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = uuidv4();
    
    res.json({
      success: true,
      data: {
        sessionId,
        userId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Create chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: error.message
    });
  }
});

app.post('/api/chat/message', authenticateToken, async (req: any, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Simple mock response - in production, this would call an AI service
    const responses = [
      "I'm here to help you with your insurance needs. What would you like to know?",
      "I can help you understand your policies, file claims, or answer questions about coverage.",
      "For specific policy details, please check your policy documents or contact your agent.",
      "Is there anything specific about your insurance that I can help clarify?"
    ];
    
    const botResponse = responses[Math.floor(Math.random() * responses.length)];
    
    res.json({
      success: true,
      data: {
        messageId: uuidv4(),
        sessionId: sessionId || uuidv4(),
        role: 'assistant',
        content: botResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

app.get('/api/chat/history', authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.query;
    
    // Mock empty history - in production, this would fetch from database
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

// API info
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Intelligent Insurance Advisor API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout (requires auth)'
      },
      policies: {
        list: 'GET /api/policies (requires auth)',
        create: 'POST /api/policies (requires auth)'
      },
      claims: {
        list: 'GET /api/claims (requires auth)'
      },
      payments: {
        list: 'GET /api/payments (requires auth)'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check at http://localhost:${PORT}/health`);
});

// Made with Bob
