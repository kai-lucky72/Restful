const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { ApiError, jwt, logger } = require('@fes/shared');
const config = require('../config');
const { User } = require('../models/user.model');
const { RefreshToken } = require('../models/refreshToken.model');
const mail = require('./mail.service');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const isDev = process.env.APP_ENV !== 'production';

function publicUser(u) {
  return {
    id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email,
    role: u.role, isActive: u.isActive, isVerified: u.isVerified, createdAt: u.createdAt,
  };
}

function issueTokens(user) {
  const payload = { sub: user.id, role: user.role, email: user.email };
  return { accessToken: jwt.signAccessToken(payload), refreshToken: jwt.signRefreshToken(payload) };
}

async function storeRefreshToken(userId, refreshToken) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const decoded = jwt.verifyRefreshToken(refreshToken);
  await RefreshToken.create({ userId, tokenHash, expiresAt: new Date(decoded.exp * 1000) });
}

// ---- OTP helpers ----
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digits
}
function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}
async function issueOtp(user) {
  const code = generateOtp();
  user.otpHash = hashOtp(code);
  user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  await user.save();
  await mail.sendOtpEmail(user, code);
  return code;
}

async function register({ firstName, lastName, email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_EXISTS');

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  // Self-registration is always a USER and starts unverified.
  const user = await User.create({ firstName, lastName, email, passwordHash, isVerified: false });

  const code = await issueOtp(user);
  logger.info('User registered, verification code sent', { userId: user.id });

  // No tokens yet — the account must be verified via the emailed OTP first.
  return {
    userId: user.id,
    email: user.email,
    verificationRequired: true,
    devOtp: isDev ? code : undefined, // shown only in dev for testing
  };
}

async function verifyOtp({ email, code }) {
  const user = await User.scope('withSecret').findOne({ where: { email } });
  if (!user) throw ApiError.badRequest('Invalid verification request.', 'INVALID_OTP');

  // Idempotent: if already verified, just log them in.
  if (user.isVerified) {
    const tokens = issueTokens(user);
    await storeRefreshToken(user.id, tokens.refreshToken);
    return { user: publicUser(user), ...tokens };
  }

  if (!user.otpHash || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw ApiError.badRequest('Your code has expired. Please request a new one.', 'OTP_EXPIRED');
  }
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    throw ApiError.unprocessable('Too many incorrect attempts. Please request a new code.', 'OTP_ATTEMPTS_EXCEEDED');
  }
  if (hashOtp(String(code)) !== user.otpHash) {
    user.otpAttempts += 1;
    await user.save();
    throw ApiError.badRequest('Incorrect verification code.', 'INVALID_OTP');
  }

  // Success — mark verified, clear OTP, issue tokens.
  user.isVerified = true;
  user.otpHash = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  await user.save();

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);
  await mail.sendWelcomeEmail(user);
  logger.info('Email verified', { userId: user.id });
  return { user: publicUser(user), ...tokens };
}

async function resendOtp(email) {
  const user = await User.scope('withSecret').findOne({ where: { email } });
  // Do not reveal whether the email exists / is already verified.
  if (!user || user.isVerified) return { sent: true };
  const code = await issueOtp(user);
  logger.info('Verification code resent', { userId: user.id });
  return { sent: true, devOtp: isDev ? code : undefined };
}

async function login({ email, password }) {
  const user = await User.scope('withSecret').findOne({ where: { email } });
  // Same message either way (standards 03 §7).
  if (!user) throw ApiError.unauthorized('Email or password is incorrect.', 'INVALID_CREDENTIALS');
  if (!user.isActive) throw ApiError.forbidden('This account is inactive.', 'ACCOUNT_INACTIVE');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    logger.warn('Failed login', { email });
    throw ApiError.unauthorized('Email or password is incorrect.', 'INVALID_CREDENTIALS');
  }

  // Unverified accounts must verify first — send a fresh code and signal the client.
  if (!user.isVerified) {
    const code = await issueOtp(user);
    if (isDev) logger.info('Dev OTP (login, unverified)', { email, code });
    throw new ApiError(403, 'Please verify your email to continue. A new code has been sent.', 'EMAIL_NOT_VERIFIED');
  }

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);
  logger.info('Login success', { userId: user.id });
  return { user: publicUser(user), ...tokens };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token is required');
  let decoded;
  try { decoded = jwt.verifyRefreshToken(refreshToken); }
  catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await RefreshToken.findOne({ where: { tokenHash, userId: decoded.sub } });
  if (!stored) throw ApiError.unauthorized('Refresh token has been revoked');

  const accessToken = jwt.signAccessToken({ sub: decoded.sub, role: decoded.role, email: decoded.email });
  return { accessToken };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await RefreshToken.destroy({ where: { tokenHash } });
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email } });
  // Always respond the same way — do not reveal whether the email exists.
  if (!user) return { sent: true };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetTokenHash = resetTokenHash;
  user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  const resetUrl = `${config.mail.frontendUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
  await mail.sendPasswordResetEmail(user, resetUrl);

  logger.info('Password reset requested', { userId: user.id });
  return {
    sent: true,
    resetToken: isDev ? rawToken : undefined,
    resetUrl: isDev ? resetUrl : undefined,
  };
}

async function resetPassword(rawToken, newPassword) {
  const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.scope('withSecret').findOne({ where: { resetTokenHash } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw ApiError.badRequest('Reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
  }
  user.passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  await user.save();
  await RefreshToken.destroy({ where: { userId: user.id } });
  await mail.sendPasswordChangedEmail(user);
  logger.info('Password reset completed', { userId: user.id });
  return { reset: true };
}

async function getMe(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');
  return publicUser(user);
}

module.exports = {
  register, verifyOtp, resendOtp, login, refresh, logout,
  forgotPassword, resetPassword, getMe, publicUser,
};
