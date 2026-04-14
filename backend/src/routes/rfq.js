const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createRFQRules, submitQuoteRules, paginationRules } = require('../middleware/validators');

const router = express.Router();
const prisma = new PrismaClient();

function generateRFQNumber() {
  return `RFQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// GET /api/rfq
router.get('/', authenticate, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { rfqNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      }),
      // Transporters only see open RFQs
      ...(req.user.role === 'TRANSPORTER' && { status: 'OPEN' }),
    };

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where, skip, take: Number(limit),
        include: {
          shipper: { select: { id: true, name: true } },
          goodsType: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { quotes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rFQ.count({ where }),
    ]);

    res.json({ data: rfqs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/rfq/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: req.params.id },
      include: {
        shipper: true, goodsType: true, route: true,
        createdBy: { select: { id: true, name: true } },
        quotes: {
          include: {
            transporter: { select: { id: true, name: true } },
            submittedBy: { select: { id: true, name: true } },
          },
          orderBy: { amount: 'asc' },
        },
        awardedQuote: { include: { transporter: { select: { id: true, name: true } } } },
      },
    });
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

    // Transporters should not see competing quote amounts
    if (req.user.role === 'TRANSPORTER') {
      rfq.quotes = rfq.quotes.filter((q) => q.transporterId === req.user.companyId);
    }

    res.json(rfq);
  } catch (err) { next(err); }
});

// POST /api/rfq
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'),
  createRFQRules,
  validate,
  async (req, res, next) => {
    try {
      // Whitelist fields
      const {
        title, shipperId, goodsTypeId, routeId,
        originCity, destCity, weight, loadingDate, deliveryDate, notes,
      } = req.body;

      const rfq = await prisma.rFQ.create({
        data: {
          title, shipperId, goodsTypeId, routeId,
          originCity, destCity,
          weight: weight ? Number(weight) : null,
          loadingDate: loadingDate ? new Date(loadingDate) : null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          notes,
          rfqNumber: generateRFQNumber(),
          createdById: req.user.id,
          status: 'OPEN',
        },
      });
      res.status(201).json(rfq);
    } catch (err) { next(err); }
  }
);

// POST /api/rfq/:id/quote
router.post(
  '/:id/quote',
  authenticate,
  authorize('TRANSPORTER', 'SUPER_ADMIN', 'ADMIN'),
  submitQuoteRules,
  validate,
  async (req, res, next) => {
    try {
      const { amount, validUntil, notes } = req.body;
      const transporterId = req.user.companyId;

      if (!transporterId) {
        return res.status(400).json({ message: 'User must be associated with a transporter company' });
      }

      const rfq = await prisma.rFQ.findUnique({ where: { id: req.params.id } });
      if (!rfq || rfq.status !== 'OPEN') {
        return res.status(400).json({ message: 'RFQ is not open for quoting' });
      }

      const existing = await prisma.quote.findFirst({
        where: { rfqId: req.params.id, transporterId, status: { not: 'WITHDRAWN' } },
      });
      if (existing) {
        return res.status(400).json({ message: 'You have already submitted a quote for this RFQ' });
      }

      const quote = await prisma.quote.create({
        data: {
          rfqId: req.params.id,
          transporterId,
          submittedById: req.user.id,
          amount: Number(amount),
          validUntil: validUntil ? new Date(validUntil) : null,
          notes,
        },
      });

      await prisma.rFQ.update({ where: { id: req.params.id }, data: { status: 'QUOTED' } });
      res.status(201).json(quote);
    } catch (err) { next(err); }
  }
);

// POST /api/rfq/:id/award/:quoteId
router.post(
  '/:id/award/:quoteId',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const [rfq, quote] = await Promise.all([
        prisma.rFQ.findUnique({ where: { id: req.params.id } }),
        prisma.quote.findUnique({ where: { id: req.params.quoteId } }),
      ]);

      if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
      if (!quote || quote.rfqId !== rfq.id) {
        return res.status(400).json({ message: 'Invalid quote for this RFQ' });
      }

      await prisma.$transaction([
        prisma.rFQ.update({ where: { id: rfq.id }, data: { status: 'AWARDED', awardedQuoteId: quote.id } }),
        prisma.quote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } }),
        prisma.quote.updateMany({
          where: { rfqId: rfq.id, id: { not: quote.id } },
          data: { status: 'REJECTED' },
        }),
      ]);

      res.json({ message: 'Quote awarded successfully' });
    } catch (err) { next(err); }
  }
);

// PUT /api/rfq/:id — whitelist fields
router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const { title, originCity, destCity, weight, loadingDate, deliveryDate, notes } = req.body;
      const rfq = await prisma.rFQ.update({
        where: { id: req.params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(originCity !== undefined && { originCity }),
          ...(destCity !== undefined && { destCity }),
          ...(weight !== undefined && { weight: Number(weight) }),
          ...(loadingDate !== undefined && { loadingDate: new Date(loadingDate) }),
          ...(deliveryDate !== undefined && { deliveryDate: new Date(deliveryDate) }),
          ...(notes !== undefined && { notes }),
        },
      });
      res.json(rfq);
    } catch (err) { next(err); }
  }
);

// DELETE /api/rfq/:id (cancel)
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      await prisma.rFQ.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
      res.json({ message: 'RFQ cancelled' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
