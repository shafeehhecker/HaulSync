const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalShipments,
      activeShipments,
      deliveredThisMonth,
      openRFQs,
      totalVehicles,
      totalDrivers,
      pendingInvoices,
      recentShipments,
      shipmentsByStatus,
      rfqsByStatus,
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.shipment.count({ where: { status: 'DELIVERED', actualDelivery: { gte: thirtyDaysAgo } } }),
      prisma.rFQ.count({ where: { status: 'OPEN' } }),
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.driver.count({ where: { isActive: true } }),
      prisma.invoice.count({ where: { status: { in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.shipment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: { select: { name: true } },
          vehicle: { select: { registrationNo: true } },
          driver: { select: { name: true } },
        },
      }),
      prisma.shipment.groupBy({ by: ['status'], _count: true }),
      prisma.rFQ.groupBy({ by: ['status'], _count: true }),
    ]);

    // Revenue trend (last 7 days)
    const revenueByDay = await prisma.invoice.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo }, status: 'PAID' },
      _sum: { totalAmount: true },
    });

    res.json({
      summary: {
        totalShipments,
        activeShipments,
        deliveredThisMonth,
        openRFQs,
        totalVehicles,
        totalDrivers,
        pendingInvoices,
      },
      recentShipments,
      shipmentsByStatus,
      rfqsByStatus,
      revenueByDay,
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/transporter-performance
router.get('/transporter-performance', authenticate, async (req, res, next) => {
  try {
    const transporters = await prisma.company.findMany({
      where: { type: { in: ['TRANSPORTER', 'BOTH'] }, isActive: true },
      include: {
        quotes: {
          where: { status: 'ACCEPTED' },
          include: { rfq: { select: { id: true } } },
        },
        _count: { select: { quotes: true } },
      },
    });

    const performance = transporters.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.city,
      totalQuotes: t._count.quotes,
      acceptedQuotes: t.quotes.filter((q) => q.status === 'ACCEPTED').length,
      winRate: t._count.quotes > 0
        ? ((t.quotes.filter((q) => q.status === 'ACCEPTED').length / t._count.quotes) * 100).toFixed(1)
        : 0,
    }));

    res.json(performance);
  } catch (err) { next(err); }
});

// GET /api/analytics/route-analysis
router.get('/route-analysis', authenticate, async (req, res, next) => {
  try {
    const routeStats = await prisma.shipment.groupBy({
      by: ['originCity', 'destCity'],
      _count: true,
      _avg: { freightAmount: true },
    });

    res.json(routeStats);
  } catch (err) { next(err); }
});

module.exports = router;
