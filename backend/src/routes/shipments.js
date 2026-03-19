const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: './uploads/pods/',
  filename: (req, file, cb) => cb(null, `pod-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function generateShipmentNumber() {
  return `SHP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

// GET /api/shipments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

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
        where, skip: Number(skip), take: Number(limit),
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
        shipper: true,
        vehicle: true,
        driver: true,
        goodsType: true,
        route: true,
        trackingEvents: { orderBy: { recordedAt: 'desc' } },
        pods: true,
        invoice: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) { next(err); }
});

// POST /api/shipments
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'), async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.create({
      data: {
        ...req.body,
        shipmentNumber: generateShipmentNumber(),
        createdById: req.user.id,
        loadingDate: new Date(req.body.loadingDate),
        expectedDelivery: req.body.expectedDelivery ? new Date(req.body.expectedDelivery) : null,
      },
    });
    res.status(201).json(shipment);
  } catch (err) { next(err); }
});

// POST /api/shipments/:id/tracking — Add tracking event
router.post('/:id/tracking', authenticate, async (req, res, next) => {
  try {
    const { eventType, location, city, state, latitude, longitude, notes } = req.body;

    const event = await prisma.trackingEvent.create({
      data: {
        shipmentId: req.params.id,
        eventType,
        location,
        city,
        state,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        notes,
      },
    });

    // Update shipment status based on event
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

    // Emit socket event for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.to(`shipment_${req.params.id}`).emit('tracking_update', event);
    }

    res.status(201).json(event);
  } catch (err) { next(err); }
});

// POST /api/shipments/:id/pod — Upload POD
router.post('/:id/pod', authenticate, upload.single('podImage'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const pod = await prisma.pOD.create({
      data: {
        shipmentId: req.params.id,
        imageUrl: `/uploads/pods/${req.file.filename}`,
        signedBy: req.body.signedBy,
        receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : new Date(),
        notes: req.body.notes,
      },
    });

    await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'POD_UPLOADED' },
    });

    res.status(201).json(pod);
  } catch (err) { next(err); }
});

// PUT /api/shipments/:id
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'), async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(shipment);
  } catch (err) { next(err); }
});

module.exports = router;
