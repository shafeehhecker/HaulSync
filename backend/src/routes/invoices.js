const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createInvoiceRules, paginationRules } = require('../middleware/validators');

const router = express.Router();
const prisma = new PrismaClient();

function generateInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

router.get('/', authenticate, paginationRules, validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { shipment: { shipmentNumber: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip, take: Number(limit),
        include: {
          shipment: { select: { id: true, shipmentNumber: true, originCity: true, destCity: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);
    res.json({ data: invoices, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  createInvoiceRules,
  validate,
  async (req, res, next) => {
    try {
      const { shipmentId, companyId, freightAmount, gstAmount = 0, invoiceDate, dueDate, notes } = req.body;
      const total = Number(freightAmount) + Number(gstAmount);
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          shipmentId, companyId,
          freightAmount: Number(freightAmount),
          gstAmount: Number(gstAmount),
          totalAmount: total,
          invoiceDate: new Date(invoiceDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
        },
      });
      res.status(201).json(invoice);
    } catch (err) { next(err); }
  }
);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    // Whitelist updatable fields
    const { status, paidDate, notes } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(paidDate !== undefined && { paidDate: new Date(paidDate) }),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(invoice);
  } catch (err) { next(err); }
});

module.exports = router;
