const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

/**
 * JWT Token Utilities
 * Handles JWT token generation, verification, and refresh
 */

/**
 * Generate JWT access token
 * @param {Object} payload - User data to include in token
 * @param {string} payload.uid - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role (admin/customer)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      uid: payload.uid,
      email: payload.email,
      role: payload.role,
      type: 'access'
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      issuer: 'ecom-warehouse-api',
      subject: payload.uid
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to include in token
 * @param {string} payload.uid - User ID
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      uid: payload.uid,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      issuer: 'ecom-warehouse-api',
      subject: payload.uid
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, type = 'access') => {
  const secret = type === 'refresh' 
    ? (process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret')
    : (process.env.JWT_SECRET || 'fallback-secret-key');

  try {
    const decoded = jwt.verify(token, secret);
    
    // Check token type matches expected type
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User data from database
 * @returns {Object} Token pair with access and refresh tokens
 */
const generateTokenPair = (user) => {
  const payload = {
    uid: user.uid || user.id,
    email: user.email,
    role: user.role || 'customer'
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ uid: payload.uid });

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    tokenType: 'Bearer'
  };
};

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7); // Remove 'Bearer ' prefix
};

/**
 * Validate user exists in database
 * @param {string} uid - User ID
 * @returns {Object} User data from database
 */
const validateUserExists = async (uid) => {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found in database');
    }

    const userData = userDoc.data();
    
    if (!userData.isActive) {
      throw new Error('User account is deactivated');
    }

    return {
      uid: userDoc.id,
      ...userData
    };
  } catch (error) {
    throw new Error(`User validation failed: ${error.message}`);
  }
};

/**
 * Store refresh token in database (for revocation)
 * @param {string} uid - User ID
 * @param {string} refreshToken - Refresh token to store
 */
const storeRefreshToken = async (uid, refreshToken) => {
  try {
    await admin.firestore()
      .collection('refresh_tokens')
      .doc(uid)
      .set({
        token: refreshToken,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      }, { merge: true });
  } catch (error) {
    console.error('Error storing refresh token:', error);
  }
};

/**
 * Revoke refresh token
 * @param {string} uid - User ID
 */
const revokeRefreshToken = async (uid) => {
  try {
    await admin.firestore()
      .collection('refresh_tokens')
      .doc(uid)
      .update({
        isActive: false,
        revokedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Error revoking refresh token:', error);
  }
};

/**
 * Verify refresh token exists and is active
 * @param {string} uid - User ID
 * @param {string} refreshToken - Refresh token to verify
 * @returns {boolean} Token validity status
 */
const verifyRefreshTokenInDB = async (uid, refreshToken) => {
  try {
    const tokenDoc = await admin.firestore()
      .collection('refresh_tokens')
      .doc(uid)
      .get();

    if (!tokenDoc.exists) {
      return false;
    }

    const tokenData = tokenDoc.data();
    return tokenData.token === refreshToken && tokenData.isActive === true;
  } catch (error) {
    console.error('Error verifying refresh token in DB:', error);
    return false;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokenPair,
  extractTokenFromHeader,
  validateUserExists,
  storeRefreshToken,
  revokeRefreshToken,
  verifyRefreshTokenInDB
};