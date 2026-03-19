const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const goods = await prisma.goodsType.findMany({ orderBy: { name: 'asc' } });
    res.json(goods);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const g = await prisma.goodsType.create({ data: req.body });
    res.status(201).json(g);
  } catch (err) { next(err); }
});

module.exports = router;
