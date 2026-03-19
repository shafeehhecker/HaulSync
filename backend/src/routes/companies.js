const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

// GET /api/companies
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, type } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(type && { type }),
    };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where, skip: Number(skip), take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.company.count({ where }),
    ]);

    res.json({ data: companies, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/companies/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        vehicles: { where: { isActive: true } },
        drivers: { where: { isActive: true } },
        _count: { select: { shipments: true, rfqs: true } },
      },
    });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) { next(err); }
});

// POST /api/companies
router.post('/', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  } catch (err) { next(err); }
});

// PUT /api/companies/:id
router.put('/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
    res.json(company);
  } catch (err) { next(err); }
});

// DELETE /api/companies/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.company.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Company deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
