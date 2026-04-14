const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  createShipmentRules,
  trackingEventRules,
  paginationRules,
} = require('../middleware/validators');

const router = express.Router();
const prisma = new PrismaClient();

// ── File upload: validate MIME type, not just extension ───────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const storage = multer.diskStorage({
  destination: './uploads/pods/',
  filename: (req, file, cb) => {
    // Strip path components from original name to prevent directory traversal
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `pod-${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and PDF files are allowed'), false);
    }
  },
});

function generateShipmentNumber() {
  return `SHP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

// GET /api/shipments
router.get('/', authenticate, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { shipmentNumber: { contains: search, mode: 'insensitive' } },
          { originCity: { contains: search, mode: 'insensitive' } },
          { destCity: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where, skip, take: Number(limit),
        include: {
          shipper: { select: { id: true, name: true } },
          vehicle: { select: { id: true, registrationNo: true, type: true } },
          driver: { select: { id: true, name: true, phone: true } },
          goodsType: { select: { id: true, name: true } },
          _count: { select: { trackingEvents: true, pods: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({ data: shipments, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/shipments/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        shipper: true, vehicle: true, driver: true, goodsType: true, route: true,
        trackingEvents: { orderBy: { recordedAt: 'desc' } },
        pods: true, invoice: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) { next(err); }
});

// POST /api/shipments
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'),
  createShipmentRules,
  validate,
  async (req, res, next) => {
    try {
      // Whitelist accepted fields to prevent mass-assignment
      const {
        shipperId, vehicleId, driverId, goodsTypeId, routeId,
        originCity, originState, destCity, destState,
        loadingDate, expectedDelivery, freightAmount, weight, distance, notes,
      } = req.body;

      const shipment = await prisma.shipment.create({
        data: {
          shipperId, vehicleId, driverId, goodsTypeId, routeId,
          originCity, originState, destCity, destState,
          loadingDate: new Date(loadingDate),
          expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
          freightAmount: freightAmount ? Number(freightAmount) : null,
          weight: weight ? Number(weight) : null,
          distance: distance ? Number(distance) : null,
          notes,
          shipmentNumber: generateShipmentNumber(),
          createdById: req.user.id,
        },
      });
      res.status(201).json(shipment);
    } catch (err) { next(err); }
  }
);

// POST /api/shipments/:id/tracking
router.post('/:id/tracking', authenticate, trackingEventRules, validate, async (req, res, next) => {
  try {
    const { eventType, location, city, state, latitude, longitude, notes } = req.body;

    // Verify shipment exists before writing tracking event
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const event = await prisma.trackingEvent.create({
      data: {
        shipmentId: req.params.id,
        eventType, location, city, state,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        notes,
      },
    });

    const statusMap = {
      DEPARTED: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
      REACHED_DESTINATION: 'REACHED_DESTINATION',
    };
    if (statusMap[eventType]) {
      await prisma.shipment.update({
        where: { id: req.params.id },
        data: {
          status: statusMap[eventType],
          ...(eventType === 'DELIVERED' && { actualDelivery: new Date() }),
        },
      });
    }

    const io = req.app.get('io');
    if (io) io.to(`shipment_${req.params.id}`).emit('tracking_update', event);

    res.status(201).json(event);
  } catch (err) { next(err); }
});

// POST /api/shipments/:id/pod — Upload Proof of Delivery (authenticated, rate-limited)
router.post(
  '/:id/pod',
  authenticate,
  uploadLimiter,
  upload.single('podImage'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No valid image uploaded' });

      // Verify shipment exists
      const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!shipment) {
        // Clean up orphan file
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ message: 'Shipment not found' });
      }

      const pod = await prisma.pOD.create({
        data: {
          shipmentId: req.params.id,
          imageUrl: `/uploads/pods/${req.file.filename}`,
          signedBy: req.body.signedBy,
          receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : new Date(),
          notes: req.body.notes,
        },
      });

      await prisma.shipment.update({ where: { id: req.params.id }, data: { status: 'POD_UPLOADED' } });
      res.status(201).json(pod);
    } catch (err) { next(err); }
  }
);

// GET /api/shipments/:shipmentId/pod/:filename — Serve POD files (authenticated only)
router.get('/:shipmentId/pod/:filename', authenticate, async (req, res, next) => {
  try {
    const { filename } = req.params;
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.resolve(__dirname, '../../../uploads/pods', safeFilename);

    // Verify the resolved path is inside the uploads directory
    const uploadsDir = path.resolve(__dirname, '../../../uploads/pods');
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    // Verify the POD record belongs to this shipment
    const pod = await prisma.pOD.findFirst({
      where: { shipmentId: req.params.shipmentId, imageUrl: { endsWith: safeFilename } },
    });
    if (!pod) return res.status(404).json({ message: 'File not found' });

    res.sendFile(filePath);
  } catch (err) { next(err); }
});

// PUT /api/shipments/:id
router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'),
  async (req, res, next) => {
    try {
      // Whitelist fields to prevent mass-assignment
      const {
        status, vehicleId, driverId, expectedDelivery, freightAmount, notes,
      } = req.body;

      const shipment = await prisma.shipment.update({
        where: { id: req.params.id },
        data: {
          ...(status !== undefined && { status }),
          ...(vehicleId !== undefined && { vehicleId }),
          ...(driverId !== undefined && { driverId }),
          ...(expectedDelivery !== undefined && { expectedDelivery: new Date(expectedDelivery) }),
          ...(freightAmount !== undefined && { freightAmount: Number(freightAmount) }),
          ...(notes !== undefined && { notes }),
        },
      });
      res.json(shipment);
    } catch (err) { next(err); }
  }
);

module.exports = router;
