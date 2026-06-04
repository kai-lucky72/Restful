const { asyncHandler, apiResponse } = require('@fes/shared');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return apiResponse.success(res, {
    statusCode: 201,
    message: 'Account created. Enter the verification code sent to your email.',
    data: result,
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);
  return apiResponse.success(res, { message: 'Email verified successfully.', data: result });
});

const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body.email);
  return apiResponse.success(res, { message: 'If the account needs verification, a new code has been sent.', data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return apiResponse.success(res, { message: 'Logged in successfully.', data: result });
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  return apiResponse.success(res, { message: 'Token refreshed.', data: result });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  return apiResponse.success(res, { message: 'Logged out successfully.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return apiResponse.success(res, { message: 'If the email exists, a reset link has been sent.', data: result });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  return apiResponse.success(res, { message: 'Password has been reset. Please log in.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.auth.id);
  return apiResponse.success(res, { message: 'Profile fetched.', data: { user } });
});

module.exports = { register, verifyOtp, resendOtp, login, refresh, logout, forgotPassword, resetPassword, me };
