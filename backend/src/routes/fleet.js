const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createVehicleRules, paginationRules } = require('../middleware/validators');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, type, companyId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      isActive: true,
      ...(search && { registrationNo: { contains: search, mode: 'insensitive' } }),
      ...(type && { type }),
      ...(companyId && { companyId }),
    };
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where, skip, take: Number(limit),
        include: { company: { select: { id: true, name: true } }, _count: { select: { trips: true } } },
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

router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  createVehicleRules,
  validate,
  async (req, res, next) => {
    try {
      // Whitelist fields
      const { registrationNo, type, make, model, year, capacity, companyId } = req.body;
      const vehicle = await prisma.vehicle.create({
        data: { registrationNo, type, make, model, year: year ? Number(year) : null, capacity, companyId },
      });
      res.status(201).json(vehicle);
    } catch (err) { next(err); }
  }
);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { type, make, model, year, capacity, isActive } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        ...(type !== undefined && { type }),
        ...(make !== undefined && { make }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year: Number(year) }),
        ...(capacity !== undefined && { capacity }),
        ...(isActive !== undefined && { isActive }),
      },
    });
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
