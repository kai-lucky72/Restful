const { validator, constants } = require('@fes/shared');
const { body } = validator;

const strongPassword = (field) =>
  body(field)
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  strongPassword('password'),
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  body('termsAccepted')
    .custom((value) => value === true || value === 'true')
    .withMessage('Terms and privacy policy must be accepted'),
];

const verifyOtpRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code').isNumeric().withMessage('Code must be digits'),
];

const resendOtpRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotRules = [body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail()];

const resetRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  strongPassword('newPassword'),
];

module.exports = { registerRules, verifyOtpRules, resendOtpRules, loginRules, forgotRules, resetRules };
