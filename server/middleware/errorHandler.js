function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 5MB limit',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === 'Only image files (jpg, png, webg, gif) are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
