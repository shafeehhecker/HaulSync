const { body, param, query, validationResult } = require('express-validator');

// Helper: run validation and return 422 on failure
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain at least one number'),
];

// ── Users ─────────────────────────────────────────────────────────────────────
const createUserRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role')
    .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'TRANSPORTER', 'VIEWER'])
    .withMessage('Invalid role'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const updateUserRules = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'TRANSPORTER', 'VIEWER'])
    .withMessage('Invalid role'),
  body('isActive').optional().isBoolean(),
];

// ── Companies ─────────────────────────────────────────────────────────────────
const createCompanyRules = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Company name is required'),
  body('type').isIn(['SHIPPER', 'TRANSPORTER', 'BOTH']).withMessage('Invalid company type'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
];

// ── Shipments ─────────────────────────────────────────────────────────────────
const createShipmentRules = [
  body('shipperId').isUUID().withMessage('Invalid shipper ID'),
  body('originCity').trim().notEmpty().isLength({ max: 100 }),
  body('destCity').trim().notEmpty().isLength({ max: 100 }),
  body('loadingDate').isISO8601().withMessage('Valid loading date is required'),
  body('freightAmount').optional().isFloat({ min: 0 }),
];

const trackingEventRules = [
  param('id').isUUID().withMessage('Invalid shipment ID'),
  body('eventType')
    .isIn(['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'DEPARTED', 'ARRIVED', 'REACHED_DESTINATION', 'DELIVERED', 'DELAYED', 'EXCEPTION'])
    .withMessage('Invalid event type'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

// ── RFQ ───────────────────────────────────────────────────────────────────────
const createRFQRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title is required (3–200 chars)'),
  body('shipperId').isUUID().withMessage('Invalid shipper ID'),
  body('originCity').trim().notEmpty(),
  body('destCity').trim().notEmpty(),
];

const submitQuoteRules = [
  param('id').isUUID().withMessage('Invalid RFQ ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('validUntil').optional().isISO8601(),
];

// ── Fleet / Drivers ───────────────────────────────────────────────────────────
const createVehicleRules = [
  body('registrationNo').trim().notEmpty().isLength({ max: 20 }).withMessage('Registration number is required'),
  body('type').trim().notEmpty(),
  body('companyId').isUUID().withMessage('Invalid company ID'),
];

const createDriverRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
  body('phone').trim().notEmpty().isLength({ max: 20 }),
  body('licenseNo').trim().notEmpty(),
  body('companyId').isUUID().withMessage('Invalid company ID'),
];

// ── Invoices ──────────────────────────────────────────────────────────────────
const createInvoiceRules = [
  body('shipmentId').isUUID().withMessage('Invalid shipment ID'),
  body('companyId').isUUID().withMessage('Invalid company ID'),
  body('freightAmount').isFloat({ min: 0 }).withMessage('Freight amount must be a non-negative number'),
  body('gstAmount').optional().isFloat({ min: 0 }),
  body('invoiceDate').isISO8601().withMessage('Valid invoice date is required'),
];

// ── Pagination ────────────────────────────────────────────────────────────────
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  validate,
  loginRules,
  changePasswordRules,
  createUserRules,
  updateUserRules,
  createCompanyRules,
  createShipmentRules,
  trackingEventRules,
  createRFQRules,
  submitQuoteRules,
  createVehicleRules,
  createDriverRules,
  createInvoiceRules,
  paginationRules,
};
