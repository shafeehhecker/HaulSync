require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { errorHandler } = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const companyRoutes = require('./src/routes/companies');
const rfqRoutes = require('./src/routes/rfq');
const shipmentRoutes = require('./src/routes/shipments');
const fleetRoutes = require('./src/routes/fleet');
const driverRoutes = require('./src/routes/drivers');
const invoiceRoutes = require('./src/routes/invoices');
const analyticsRoutes = require('./src/routes/analytics');
const goodsRoutes = require('./src/routes/goods');
const routeRoutes = require('./src/routes/routes');

const app = express();
const server = http.createServer(app);

// Socket.io for real-time tracking
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'HaulSync API', version: '1.0.0' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goods', goodsRoutes);
app.use('/api/routes', routeRoutes);

// Socket.io tracking namespace
io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  socket.on('join_shipment', (shipmentId) => {
    socket.join(`shipment_${shipmentId}`);
    console.log(`Client joined shipment room: ${shipmentId}`);
  });

  socket.on('leave_shipment', (shipmentId) => {
    socket.leave(`shipment_${shipmentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚛 HaulSync API running on port ${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/health\n`);
});

module.exports = { app, io };
