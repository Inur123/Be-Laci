const notFound = (req, res, next) => {
  const error = new Error("Route tidak ditemukan");
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    error: {
      code: err.code || "SERVER_ERROR",
      details: err.details || undefined,
    },
  });
};

module.exports = { notFound, errorHandler };
