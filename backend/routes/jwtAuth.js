const express = require('express');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const {
  generateTokenPair,
  verifyToken,
  validateUserExists,
  storeRefreshToken,
  revokeRefreshToken,
  verifyRefreshTokenInDB
} = require('../utils/jwtUtils');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * Register new user with JWT tokens
 * POST /api/jwt-auth/register
 */
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['customer', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, role = 'customer' } = req.body;

    // Check if user already exists
    const existingUser = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Hash password for database storage
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      password: hashedPassword, // Store hashed password
      name,
      role,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      authMethods: ['jwt', 'firebase'] // Support both auth methods
    };

    await admin.firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set(userData);

    // Generate JWT tokens
    const tokens = await generateTokenPair(userRecord.uid);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          uid: userRecord.uid,
          email,
          name,
          role,
          isActive: true
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });

  } catch (error) {
    console.error('JWT Registration error:', error);

    // Handle Firebase specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        error: 'Password is too weak'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

/**
 * Login user with email/password and return JWT tokens
 * POST /api/jwt-auth/login
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const userQuery = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if account is active
    if (!userData.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT tokens
    const tokens = await generateTokenPair(userData.uid);

    // Update last login
    await admin.firestore()
      .collection('users')
      .doc(userData.uid)
      .update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: userData.isActive
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });

  } catch (error) {
    console.error('JWT Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

/**
 * Refresh JWT access token using refresh token
 * POST /api/jwt-auth/refresh
 */
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');

    // Verify refresh token exists in database
    const isValidRefreshToken = await verifyRefreshTokenInDB(decoded.uid, refreshToken);
    if (!isValidRefreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Validate user still exists and is active
    const userData = await validateUserExists(decoded.uid);

    // Generate new token pair
    const tokens = await generateTokenPair(decoded.uid);

    // Revoke old refresh token and store new one
    await revokeRefreshToken(decoded.uid, refreshToken);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });

  } catch (error) {
    console.error('JWT Refresh error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

/**
 * Logout user by revoking refresh token
 * POST /api/jwt-auth/logout
 */
router.post('/logout', [
  body('refreshToken').optional()
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Verify and decode refresh token to get user ID
      try {
        const decoded = verifyToken(refreshToken, 'refresh');
        await revokeRefreshToken(decoded.uid, refreshToken);
      } catch (error) {
        console.warn('Failed to revoke refresh token during logout:', error.message);
        // Continue with logout even if token revocation fails
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('JWT Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
});

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 * POST /api/jwt-auth/logout-all
 * Requires authentication
 */
router.post('/logout-all', async (req, res) => {
  try {
    // This would require authentication middleware
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Revoke all refresh tokens for user
    await admin.firestore()
      .collection('refreshTokens')
      .where('userId', '==', userId)
      .get()
      .then(snapshot => {
        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        return batch.commit();
      });

    res.json({
      success: true,
      message: 'Logout from all devices successful'
    });

  } catch (error) {
    console.error('JWT Logout All error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout all failed',
      details: error.message
    });
  }
});

/**
 * Get current user profile (requires authentication)
 * GET /api/jwt-auth/profile
 */
router.get('/profile', async (req, res) => {
  try {
    // This would require authentication middleware
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userData = await validateUserExists(userId);

    res.json({
      success: true,
      data: {
        user: {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('JWT Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      details: error.message
    });
  }
});

module.exports = router;