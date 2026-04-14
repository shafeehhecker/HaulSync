const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createCompanyRules, paginationRules } = require('../middleware/validators');

const router = express.Router();
const prisma = new PrismaClient();
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

router.get('/', authenticate, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      isActive: true,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(type && { type }),
    };
    const [companies, total] = await Promise.all([
      prisma.company.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      prisma.company.count({ where }),
    ]);
    res.json({ data: companies, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

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

router.post(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  createCompanyRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, type, email, phone, address, city, state, country, gstNumber } = req.body;
      const company = await prisma.company.create({
        data: { name, type, email, phone, address, city, state, country, gstNumber },
      });
      res.status(201).json(company);
    } catch (err) { next(err); }
  }
);

router.put('/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { name, email, phone, address, city, state, country, gstNumber } = req.body;
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(gstNumber !== undefined && { gstNumber }),
      },
    });
    res.json(company);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.company.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Company deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
