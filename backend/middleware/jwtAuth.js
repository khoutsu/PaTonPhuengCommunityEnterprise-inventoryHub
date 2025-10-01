const { 
  verifyToken, 
  extractTokenFromHeader, 
  validateUserExists 
} = require('../utils/jwtUtils');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user info to request object
 */
const jwtAuthMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token, 'access');
    
    // Validate user exists and is active
    const userData = await validateUserExists(decoded.uid);
    
    // Add user info to request object
    req.user = {
      uid: userData.uid,
      email: userData.email,
      role: userData.role || 'customer',
      name: userData.name,
      isActive: userData.isActive,
      authMethod: 'jwt'
    };

    next();
  } catch (error) {
    console.error('JWT Auth Error:', error.message);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    if (error.message.includes('User not found')) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (error.message.includes('deactivated')) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Flexible Authentication Middleware
 * Supports both JWT and Firebase ID tokens
 */
const flexibleAuthMiddleware = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
        code: 'TOKEN_MISSING'
      });
    }

    // Try JWT first
    try {
      const decoded = verifyToken(token, 'access');
      const userData = await validateUserExists(decoded.uid);
      
      req.user = {
        uid: userData.uid,
        email: userData.email,
        role: userData.role || 'customer',
        name: userData.name,
        isActive: userData.isActive,
        authMethod: 'jwt'
      };
      
      return next();
    } catch (jwtError) {
      // If JWT fails, try Firebase ID token
      try {
        const admin = require('firebase-admin');
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(decodedToken.uid)
          .get();

        if (!userDoc.exists) {
          return res.status(404).json({
            success: false,
            error: 'User not found in database',
            code: 'USER_NOT_FOUND'
          });
        }

        const userData = userDoc.data();

        if (!userData.isActive) {
          return res.status(403).json({
            success: false,
            error: 'Account is deactivated',
            code: 'ACCOUNT_DEACTIVATED'
          });
        }

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || userData.email,
          role: userData.role || 'customer',
          name: userData.name || decodedToken.name,
          isActive: userData.isActive,
          authMethod: 'firebase'
        };

        return next();
      } catch (firebaseError) {
        console.error('Both JWT and Firebase auth failed:', {
          jwt: jwtError.message,
          firebase: firebaseError.message
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid token format',
          code: 'TOKEN_INVALID'
        });
      }
    }
  } catch (error) {
    console.error('Flexible auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication system error',
      code: 'AUTH_SYSTEM_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Single role or array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
const requireAdmin = requireRole('admin');

/**
 * Customer or Admin middleware
 */
const requireCustomerOrAdmin = requireRole(['customer', 'admin']);

module.exports = {
  jwtAuthMiddleware,
  flexibleAuthMiddleware,
  requireRole,
  requireAdmin,
  requireCustomerOrAdmin
};