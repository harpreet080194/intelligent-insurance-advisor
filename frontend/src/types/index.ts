// User Types
export interface User {
  userId: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  theme: 'light' | 'dark';
}

// Policy Types
export type PolicyType = 'HEALTH' | 'AUTO' | 'HOME' | 'LIFE';
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Policy {
  policyId: string;
  policyNumber: string;
  type: PolicyType;
  status: PolicyStatus;
  premium: number;
  coverage: PolicyCoverage;
  providerId: string;
  providerName?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface PolicyCoverage {
  coverageAmount: number;
  deductible: number;
  details: Record<string, any>;
}

export interface PolicyRecommendation {
  policyId: string;
  type: PolicyType;
  providerName: string;
  premium: number;
  coverage: PolicyCoverage;
  score: number;
  reasons: string[];
}

// Claim Types
export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface Claim {
  claimId: string;
  claimNumber: string;
  userId: string;
  policyId: string;
  type: string;
  amount: number;
  status: ClaimStatus;
  documents: ClaimDocument[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDocument {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  url: string;
}

export interface ClaimSubmission {
  policyId: string;
  type: string;
  amount: number;
  description: string;
  documents: File[];
}

// Payment Types
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'WALLET';

export interface Payment {
  paymentId: string;
  userId: string;
  policyId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentRequest {
  policyId: string;
  amount: number;
  method: PaymentMethod;
  paymentDetails: PaymentDetails;
}

export interface PaymentDetails {
  cardNumber?: string;
  cardHolderName?: string;
  expiryDate?: string;
  cvv?: string;
  bankAccount?: string;
  routingNumber?: string;
}

// Chat Types
export interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  entities?: Record<string, any>;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  mfaRequired?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface FormErrors {
  [key: string]: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Made with Bob
