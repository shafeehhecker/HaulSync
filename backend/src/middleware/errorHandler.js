const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'A record with this value already exists', field: err.meta?.target });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
