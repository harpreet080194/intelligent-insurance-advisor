interface RegisterData {
  email: string;
  password: string;
  profile?: any;
  preferences?: any;
}

interface LoginData {
  email: string;
  password: string;
  mfaCode?: string;
}

class AuthService {
  private getDatabase() {
    const databaseModule = require('../config/database');
    return databaseModule.default || databaseModule;
  }

  private getBcrypt() {
    return require('bcrypt');
  }

  private getJwt() {
    return require('jsonwebtoken');
  }

  private getUuid() {
    return require('uuid').v4;
  }

  private getSpeakeasy() {
    return require('speakeasy');
  }

  private getQRCode() {
    return require('qrcode');
  }

  private getJwtSecret() {
    return process.env.JWT_SECRET || 'dev_jwt_secret';
  }

  private getJwtRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
  }

  private getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '1h';
  }

  private getJwtRefreshExpiresIn() {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  private getBcryptRounds() {
    return parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  }

  async register(data: RegisterData) {
    const db = this.getDatabase();
    const bcrypt = this.getBcrypt();
    const newId = this.getUuid();

    const existingUser = await db('users').where({ email: data.email }).first();
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, this.getBcryptRounds());
    const userId = newId();

    await db('users').insert({
      user_id: userId,
      email: data.email,
      password_hash: passwordHash,
      profile: JSON.stringify(data.profile || {}),
      preferences: JSON.stringify(data.preferences || {}),
      email_verification_token: newId(),
      email_verified: false,
      mfa_enabled: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const token = this.generateToken(userId, data.email);
    const refreshToken = this.generateRefreshToken(userId, data.email);

    return {
      user: {
        userId,
        email: data.email,
        emailVerified: false,
        mfaEnabled: false,
        profile: data.profile || {},
      },
      token,
      refreshToken,
    };
  }

  async login(data: LoginData) {
    const db = this.getDatabase();
    const bcrypt = this.getBcrypt();

    const user = await db('users').where({ email: data.email }).first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (user.mfa_enabled) {
      if (!data.mfaCode) {
        throw new Error('MFA code required');
      }

      const isMfaValid = this.verifyMfaCode(user.mfa_secret, data.mfaCode);
      if (!isMfaValid) {
        throw new Error('Invalid MFA code');
      }
    }

    await db('users')
      .where({ user_id: user.user_id })
      .update({ last_login_at: new Date(), updated_at: new Date() });

    const profile = this.parseJson(user.profile);
    const token = this.generateToken(user.user_id, user.email, user.role || undefined);
    const refreshToken = this.generateRefreshToken(user.user_id, user.email);

    return {
      user: {
        userId: user.user_id,
        email: user.email,
        emailVerified: Boolean(user.email_verified),
        mfaEnabled: Boolean(user.mfa_enabled),
        role: user.role || undefined,
        profile,
      },
      token,
      refreshToken,
    };
  }

  async enableMfa(userId: string) {
    const db = this.getDatabase();
    const speakeasy = this.getSpeakeasy();
    const QRCode = this.getQRCode();

    const user = await db('users').where({ user_id: userId }).first();
    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${process.env.MFA_ISSUER || 'Insurance Advisor'} (${user.email})`,
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await db('users')
      .where({ user_id: userId })
      .update({
        mfa_secret: secret.base32,
        updated_at: new Date(),
      });

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verifyAndEnableMfa(userId: string, code: string) {
    const db = this.getDatabase();

    const user = await db('users').where({ user_id: userId }).first();
    if (!user || !user.mfa_secret) {
      throw new Error('MFA setup not initiated');
    }

    const isValid = this.verifyMfaCode(user.mfa_secret, code);
    if (!isValid) {
      throw new Error('Invalid MFA code');
    }

    await db('users')
      .where({ user_id: userId })
      .update({
        mfa_enabled: true,
        updated_at: new Date(),
      });
  }

  async disableMfa(userId: string, password: string) {
    const db = this.getDatabase();
    const bcrypt = this.getBcrypt();

    const user = await db('users').where({ user_id: userId }).first();
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    await db('users')
      .where({ user_id: userId })
      .update({
        mfa_enabled: false,
        mfa_secret: null,
        updated_at: new Date(),
      });
  }

  async refreshAccessToken(refreshToken: string) {
    const db = this.getDatabase();
    const jwt = this.getJwt();

    const decoded = jwt.verify(refreshToken, this.getJwtRefreshSecret()) as {
      userId: string;
      email: string;
    };

    const user = await db('users').where({ user_id: decoded.userId }).first();
    if (!user || !user.is_active) {
      throw new Error('Invalid refresh token');
    }

    return {
      token: this.generateToken(user.user_id, user.email, user.role || undefined),
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const db = this.getDatabase();
    const bcrypt = this.getBcrypt();

    const user = await db('users').where({ user_id: userId }).first();
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, this.getBcryptRounds());

    await db('users')
      .where({ user_id: userId })
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date(),
      });
  }

  private generateToken(userId: string, email: string, role?: string) {
    const jwt = this.getJwt();
    return jwt.sign(
      { userId, email, role },
      this.getJwtSecret(),
      { expiresIn: this.getJwtExpiresIn() }
    );
  }

  private generateRefreshToken(userId: string, email: string) {
    const jwt = this.getJwt();
    return jwt.sign(
      { userId, email },
      this.getJwtRefreshSecret(),
      { expiresIn: this.getJwtRefreshExpiresIn() }
    );
  }

  private verifyMfaCode(secret: string, code: string) {
    const speakeasy = this.getSpeakeasy();
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: parseInt(process.env.MFA_WINDOW || '2', 10),
    });
  }

  private parseJson(value: any) {
    if (!value) {
      return {};
    }

    if (typeof value === 'object') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
}

export default new AuthService();

// Made with Bob
