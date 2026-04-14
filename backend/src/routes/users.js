const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createUserRules, updateUserRules, paginationRules } = require('../middleware/validators');

const router = express.Router();
const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'HaulSync@1234'; // kept for seeding only — always force-change on first login

// GET /api/users
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  paginationRules,
  validate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search, role } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: {
            id: true, name: true, email: true, role: true, phone: true,
            isActive: true, createdAt: true,
            company: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ data: users, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/users
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  createUserRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role, phone, companyId } = req.body;

      // Prevent privilege escalation: ADMINs cannot create SUPER_ADMINs
      if (req.user.role === 'ADMIN' && role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Insufficient permissions to assign this role' });
      }

      const hashed = await bcrypt.hash(password || DEFAULT_PASSWORD, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role, phone, companyId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/:id
router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  updateUserRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, phone, role, isActive, companyId } = req.body;

      // Prevent ADMINs from editing SUPER_ADMINs or escalating to SUPER_ADMIN
      if (req.user.role === 'ADMIN') {
        const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
        if (target?.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { name, phone, role, isActive, companyId },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/users/:id (soft-delete / deactivate)
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req, res, next) => {
    try {
      // Prevent self-deactivation
      if (req.params.id === req.user.id) {
        return res.status(400).json({ message: 'Cannot deactivate your own account' });
      }
      await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
      res.json({ message: 'User deactivated' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
