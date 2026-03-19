const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, companyId } = req.query;
    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }),
      ...(companyId && { companyId }),
    };
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: { company: { select: { id: true, name: true } }, _count: { select: { trips: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.driver.count({ where }),
    ]);
    res.json({ data: drivers, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { company: true, trips: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.create({ data: req.body });
    res.status(201).json(driver);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
    res.json(driver);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.driver.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Driver deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
