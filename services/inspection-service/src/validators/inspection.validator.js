const { validator, constants } = require('@fes/shared');
const { body, param } = validator;

const idRule = [param('id').isUUID().withMessage('Invalid id')];
const timeRule = (f) => body(f).optional({ nullable: true, checkFalsy: true })
  .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Time must be HH:mm');

// USER requests or ADMIN schedules. scheduledDate optional for a USER request.
const createRules = [
  body('extinguisherId').isUUID().withMessage('Valid extinguisher id is required'),
  body('scheduledDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Valid scheduled date is required'),
  timeRule('scheduledTime'),
  body('inspectorId').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('notes').optional({ nullable: true }).isString(),
];

const assignInspectorRules = [
  ...idRule,
  body('inspectorId').isUUID().withMessage('Valid inspector id is required'),
  body('scheduledDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  timeRule('scheduledTime'),
];

const performRules = [
  ...idRule,
  body('result').isIn([
    constants.INSPECTION_RESULT.PASSED,
    constants.INSPECTION_RESULT.FAILED,
    constants.INSPECTION_RESULT.NEEDS_MAINTENANCE,
    constants.INSPECTION_RESULT.EXPIRED,
  ]).withMessage('Result must be PASSED, FAILED, NEEDS_MAINTENANCE or EXPIRED'),
  body('performedDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('issuesFound').optional({ nullable: true }).isString(),
  body('notes').optional({ nullable: true }).isString(),
  body('recommendations').optional({ nullable: true }).isString(),
];

const maintenanceRules = [
  body('extinguisherId').isUUID().withMessage('Valid extinguisher id is required'),
  body('inspectionId').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('actionTaken').trim().notEmpty().withMessage('Action taken is required'),
  body('maintenanceDate').isISO8601().withMessage('Valid maintenance date is required'),
  body('issuesIdentified').optional({ nullable: true }).isString(),
  body('notes').optional({ nullable: true }).isString(),
  body('recommendations').optional({ nullable: true }).isString(),
  body('statusAfterMaintenance').optional({ nullable: true, checkFalsy: true })
    .isIn(Object.values(constants.MAINTENANCE_STATUS)).withMessage('Invalid statusAfterMaintenance'),
];

module.exports = { idRule, createRules, assignInspectorRules, performRules, maintenanceRules };
