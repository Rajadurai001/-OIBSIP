const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc  Register a new user + send email verification link
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    verificationToken: hashedToken,
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your Pizza Hub account',
    html: `<p>Hi ${user.name},</p>
           <p>Thanks for signing up! Please verify your email by clicking the link below:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>This link expires in 24 hours.</p>`,
  });

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
    userId: user._id,
  });
});

// @desc  Verify email via token from the emailed link
// @route GET /api/auth/verify-email/:token
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Verification link is invalid or has expired');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully. You can now log in.' });
});

// @desc  Login user (must be verified) - returns JWT
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email before logging in');
  }

  res.json({
    token: generateToken(user._id, 'user'),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    },
  });
});

// @desc  Request password reset link
// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the email exists,
  // so the endpoint can't be used to enumerate registered accounts.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1h
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Pizza Hub password',
      html: `<p>Hi ${user.name},</p>
             <p>Click the link below to reset your password. This link expires in 1 hour.</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  }

  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

// @desc  Reset password using token from the emailed link
// @route POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in with your new password.' });
});

// @desc  Get logged-in user's profile
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
};
