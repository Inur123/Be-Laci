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

    if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
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

module.exports = { authRequired };
