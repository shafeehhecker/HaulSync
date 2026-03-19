const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/fleet
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, type, companyId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && { registrationNo: { contains: search, mode: 'insensitive' } }),
      ...(type && { type }),
      ...(companyId && { companyId }),
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: {
          company: { select: { id: true, name: true } },
          _count: { select: { trips: true } },
        },
        orderBy: { registrationNo: 'asc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({ data: vehicles, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        trips: { take: 10, orderBy: { createdAt: 'desc' }, include: { driver: { select: { name: true } } } },
      },
    });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Vehicle deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
