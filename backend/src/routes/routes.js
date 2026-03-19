const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(routes);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const route = await prisma.route.create({ data: req.body });
    res.status(201).json(route);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const route = await prisma.route.update({ where: { id: req.params.id }, data: req.body });
    res.json(route);
  } catch (err) { next(err); }
});

module.exports = router;
