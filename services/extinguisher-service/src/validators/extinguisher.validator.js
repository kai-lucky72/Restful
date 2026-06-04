const { validator, constants } = require('@fes/shared');
const { body, param } = validator;

const idRule = [param('id').isUUID().withMessage('Invalid extinguisher id')];

const createRules = [
  body('serialNumber').trim().notEmpty().withMessage('Serial number is required'),
  body('location').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
  body('type').isIn(constants.EXTINGUISHER_TYPES).withMessage('Invalid extinguisher type'),
  body('size').isIn(constants.EXTINGUISHER_SIZES).withMessage('Invalid extinguisher size'),
  body('userId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Assigned user id must be valid'),
  body('assignedUserName').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 160 }),
  body('assignedUserEmail').optional({ nullable: true, checkFalsy: true }).trim().isEmail(),
  body('installationDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Valid installation date is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
];

const updateRules = [
  ...idRule,
  body('serialNumber').optional().trim().notEmpty(),
  body('location').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
  body('type').optional().isIn(constants.EXTINGUISHER_TYPES),
  body('size').optional().isIn(constants.EXTINGUISHER_SIZES),
  body('expiryDate').optional().isISO8601(),
];

const assignRules = [
  ...idRule,
  body('userId').isUUID().withMessage('Valid user id is required'),
  body('assignedUserName').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 160 }),
  body('assignedUserEmail').optional({ nullable: true, checkFalsy: true }).trim().isEmail(),
];

const installRules = [
  ...idRule,
  body('installationDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Valid installation date is required'),
];

// ---- Requests ----
const createRequestRules = [
  body('quantity').optional().isInt({ min: 1, max: 100 }).withMessage('Quantity must be 1-100'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('reason').optional({ nullable: true }).isString(),
];

const reviewRequestRules = [
  ...idRule,
  body('decision').isIn(constants.REQUEST_DECISIONS).withMessage('Decision must be APPROVE, REJECT or REQUEST_MORE_INFO'),
  body('adminComment').optional({ nullable: true }).isString(),
];

module.exports = {
  idRule, createRules, updateRules, assignRules, installRules,
  createRequestRules, reviewRequestRules,
};
