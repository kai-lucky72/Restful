const { validator, constants } = require('@fes/shared');
const { body, param } = validator;

const idRule = [param('id').isUUID().withMessage('Invalid user id')];

const updateProfileRules = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
];

const changeRoleRules = [...idRule, body('role').isIn(Object.values(constants.ROLES)).withMessage('Invalid role')];
const setStatusRules = [...idRule, body('isActive').isBoolean().withMessage('isActive must be boolean')];

const createUserRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
  body('role').optional().isIn(Object.values(constants.ROLES)).withMessage('Invalid role'),
];

module.exports = { idRule, updateProfileRules, changePasswordRules, changeRoleRules, setStatusRules, createUserRules };
