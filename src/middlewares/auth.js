const jwt = require("jsonwebtoken");
const { accessTokenSecret } = require("../config/jwt");
const prisma = require("../utils/prisma");

const authRequired = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    const error = new Error("Belum terautentikasi");
    error.statusCode = 401;
    error.code = "UNAUTHORIZED";
    return next(error);
  }

  try {
    const payload = jwt.verify(token, accessTokenSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, tokenVersion: true, isActive: true },
    });

    const tokenVersion = payload.tv ?? 0;
    if (!user || !user.isActive || user.tokenVersion !== tokenVersion) {
      const error = new Error("Token tidak valid");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      return next(error);
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    const error = new Error("Token tidak valid");
    error.statusCode = 401;
    error.code = "UNAUTHORIZED";
    return next(error);
  }
};

const roleRequired = (...roles) => (req, res, next) => {
  if (!req.user) {
    const error = new Error("Belum terautentikasi");
    error.statusCode = 401;
    error.code = "UNAUTHORIZED";
    return next(error);
  }

  if (!roles.includes(req.user.role)) {
    const error = new Error("Akses ditolak");
    error.statusCode = 403;
    error.code = "ROLE_FORBIDDEN";
    return next(error);
  }

  return next();
};

module.exports = { authRequired, roleRequired };
