// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError, asyncHandler } from './error';
import User, { IUser } from '../models/User';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-middleware');

// Interface for JWT payload
interface JwtPayload {
  id: string;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Protect routes - Verifies JWT token and attaches user to request
 */
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header (Bearer token)
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check if token exists in cookie
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(createError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey') as JwtPayload;

    // Get user from database
    const user = await User.findById(decoded.id);

    // Check if user exists
    if (!user) {
      return next(createError('User not found', 401));
    }

    // Set user in request
    req.user = user;
    next();
  } catch (err) {
    logger.error('Token verification failed:', err);
    return next(createError('Not authorized to access this route', 401));
  }
});

// backend/src/controllers/auth.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { asyncHandler, createError } from '../middleware/error';
import User, { IUser, SubscriptionPlanType } from '../models/User';
import CreditTransaction, { TransactionType } from '../models/CreditTransaction';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-controller');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createError('Email already in use', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    subscriptionPlan: {
      type: SubscriptionPlanType.PRO,
      monthlyCredits: 0, // No credits until subscription is purchased
      isLifetime: false,
      purchasedAt: new Date()
    }
  });

  // Send response with token
  sendTokenResponse(user, 201, res);
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(createError('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(createError('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(createError('Invalid credentials', 401));
  }

  // Send response with token
  sendTokenResponse(user, 200, res);
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // User is already available in req.user from the protect middleware
  const user = await User.findById(req.user!.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/me
 * @access Private
 */
export const updateMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body;

  // Create fields object
  const fieldsToUpdate = {
    name,
    email
  };

  // Update user
  const user = await User.findByIdAndUpdate(req.user!.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Update password
 * @route PUT /api/auth/updatepassword
 * @access Private
 */
export const updatePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user!.id).select('+password');

  // Check current password
  if (!(await user!.matchPassword(currentPassword))) {
    return next(createError('Current password is incorrect', 401));
  }

  // Set new password
  user!.password = newPassword;
  await user!.save();

  // Send response with new token
  sendTokenResponse(user!, 200, res);
});

/**
 * Logout user / clear cookie
 * @route GET /api/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear cookie if it exists
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * Forgot password
 * @route POST /api/auth/forgotpassword
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return next(createError('No user found with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  // Save reset token to DB
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  // Create message
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    // In a real application, you would send an email here
    // For now, we'll just log the reset URL
    logger.info(`Reset password URL: ${resetUrl}`);

    res.status(200).json({
      success: true,
      data: 'Email sent',
      resetUrl // Remove this in production
    });
  } catch (err) {
    logger.error('Error sending reset password email:', err);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(createError('Email could not be sent', 500));
  }
});

/**
 * Reset password
 * @route PUT /api/auth/resetpassword/:resettoken
 * @access Public
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // Find user by reset token
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(createError('Invalid or expired token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Send response with new token
  sendTokenResponse(user, 200, res);
});

/**
 * Get user credits
 * @route GET /api/auth/credits
 * @access Private
 */
export const getCredits = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);

  res.status(200).json({
    success: true,
    data: {
      credits: user!.credits,
      reservedCredits: user!.reservedCredits,
      subscriptionPlan: user!.subscriptionPlan
    }
  });
});

/**
 * Get credit transactions
 * @route GET /api/auth/credits/transactions
 * @access Private
 */
export const getCreditTransactions = asyncHandler(async (req: Request, res: Response) => {
  // Set up pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Get transactions count
  const total = await CreditTransaction.countDocuments({ user: req.user!.id });

  // Get transactions with pagination
  const transactions = await CreditTransaction.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    hasNext: endIndex < total,
    hasPrev: startIndex > 0
  };

  res.status(200).json({
    success: true,
    pagination,
    data: transactions
  });
});

/**
 * Helper function to send token response
 * @param user User document
 * @param statusCode HTTP status code
 * @param res Response object
 */
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || '30') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// backend/src/routes/auth.ts
import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  updateMe, 
  updatePassword, 
  logout, 
  forgotPassword, 
  resetPassword,
  getCredits,
  getCreditTransactions
} from '../controllers/auth';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/updatepassword', updatePassword);
router.get('/logout', logout);
router.get('/credits', getCredits);
router.get('/credits/transactions', getCreditTransactions);

export default router;
