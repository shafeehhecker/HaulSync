const errorHandler = (err, req, res, next) => {
  // Never log full errors to stdout in production — use a proper logger in real deployments
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.message, err.stack);
  } else {
    // Minimal production log — no stack trace
    console.error(`[${new Date().toISOString()}] ERROR ${err.status || 500}: ${err.message}`);
  }

  // Multer file filter errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(415).json({ message: err.message });
  }

  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'A record with this value already exists' });
    // NOTE: intentionally omit err.meta?.target — it leaks DB field names
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    message: status === 500 ? 'Internal server error' : (err.message || 'Internal server error'),
    // Stack trace ONLY in development — never in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };

