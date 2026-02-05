const prisma = require("../utils/prisma");
const { ok, paginateMeta } = require("../utils/response");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const listMyActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
    const { q, action, method } = req.query;

    const where = {
      userId,
      ...(isNonEmptyString(action) ? { action: action.trim() } : {}),
      ...(isNonEmptyString(method) ? { method: method.trim().toUpperCase() } : {}),
      ...(isNonEmptyString(q)
        ? {
            OR: [
              { endpoint: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.logActivity.count({ where }),
      prisma.logActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return ok(res, data, "OK", paginateMeta({ page, limit, total }));
  } catch (err) {
    return next(err);
  }
};

const listAllActivities = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
    const { q, action, method, userId } = req.query;

    const where = {
      ...(isNonEmptyString(userId) ? { userId } : {}),
      ...(isNonEmptyString(action) ? { action: action.trim() } : {}),
      ...(isNonEmptyString(method) ? { method: method.trim().toUpperCase() } : {}),
      ...(isNonEmptyString(q)
        ? {
            OR: [
              { endpoint: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.logActivity.count({ where }),
      prisma.logActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return ok(res, data, "OK", paginateMeta({ page, limit, total }));
  } catch (err) {
    return next(err);
  }
};

const statsMyActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const total = await prisma.logActivity.count({ where: { userId } });
    return ok(res, { total });
  } catch (err) {
    return next(err);
  }
};

const statsAllActivities = async (req, res, next) => {
  try {
    const total = await prisma.logActivity.count();
    return ok(res, { total });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listMyActivities,
  listAllActivities,
  statsMyActivities,
  statsAllActivities,
};
