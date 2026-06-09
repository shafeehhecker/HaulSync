const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/reports/invoices — summary for a date range
router.get('/invoices', authenticate, async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const where = {
      ...(from && { invoiceDate: { gte: new Date(from) } }),
      ...(to && { invoiceDate: { ...( from ? { gte: new Date(from) } : {}), lte: new Date(to) } }),
      ...(status && { status }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        shipment: { select: { shipmentNumber: true, originCity: true, destCity: true, loadingDate: true } },
        company: { select: { name: true, email: true, phone: true, address: true } },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const summary = {
      totalInvoices: invoices.length,
      totalFreight: invoices.reduce((s, i) => s + i.freightAmount, 0),
      totalGST: invoices.reduce((s, i) => s + i.gstAmount, 0),
      totalAmount: invoices.reduce((s, i) => s + i.totalAmount, 0),
      paid: invoices.filter(i => i.status === 'PAID').length,
      pending: invoices.filter(i => i.status === 'PENDING').length,
      disputed: invoices.filter(i => i.status === 'DISPUTED').length,
    };

    res.json({ invoices, summary });
  } catch (err) { next(err); }
});

// GET /api/reports/shipments
router.get('/shipments', authenticate, async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const where = {
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { ...(from ? { gte: new Date(from) } : {}), lte: new Date(to) } }),
      ...(status && { status }),
    };

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        shipper: { select: { name: true } },
        vehicle: { select: { registrationNo: true } },
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: shipments.length,
      delivered: shipments.filter(s => s.status === 'DELIVERED' || s.status === 'COMPLETED').length,
      inTransit: shipments.filter(s => s.status === 'IN_TRANSIT').length,
      totalFreight: shipments.reduce((s, sh) => s + (sh.freightAmount || 0), 0),
    };

    res.json({ shipments, summary });
  } catch (err) { next(err); }
});

module.exports = router;
