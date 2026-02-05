const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const { ok, paginateMeta } = require("../utils/response");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const ensureVerified = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (!user.emailVerified) {
    const error = new Error("Email belum terverifikasi");
    error.statusCode = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }
};

const parseStatus = (value) => {
  if (!isNonEmptyString(value)) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "active", "aktif"].includes(normalized)) return true;
  if (["false", "0", "inactive", "nonaktif"].includes(normalized)) return false;
  return undefined;
};

const parseVerified = (value) => {
  if (!isNonEmptyString(value)) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "verified", "terverifikasi"].includes(normalized)) return true;
  if (["false", "0", "unverified", "belum"].includes(normalized)) return false;
  return undefined;
};

const listUserPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
    const { q, status, emailVerified } = req.query;

    const isActive = parseStatus(status);
    const isVerified = parseVerified(emailVerified);
    const query = isNonEmptyString(q) ? q.trim() : null;

    const where = {
      role: "SEKRETARIS_PAC",
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(typeof isVerified === "boolean"
        ? isVerified
          ? { emailVerified: { not: null } }
          : { emailVerified: null }
        : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
    ]);

    return ok(res, data, "OK", paginateMeta({ page, limit, total }));
  } catch (err) {
    return next(err);
  }
};

const getUserPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const data = await prisma.user.findFirst({
      where: { id, role: "SEKRETARIS_PAC" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        image: true,
        createdAt: true,
      },
    });

    if (!data) {
      const error = new Error("User PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const toggleActiveUserPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: { id, role: "SEKRETARIS_PAC" },
      select: { id: true, isActive: true },
    });

    if (!user) {
      const error = new Error("User PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });

    return ok(res, updated);
  } catch (err) {
    return next(err);
  }
};

const resetPasswordUserPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: { id, role: "SEKRETARIS_PAC" },
      select: { id: true, email: true },
    });

    if (!user) {
      const error = new Error("User PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const tempPassword = crypto.randomBytes(5).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return ok(res, { temporaryPassword: tempPassword, email: normalizeEmail(user.email) });
  } catch (err) {
    return next(err);
  }
};

const statsUserPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);

    const [total, active, verified] = await prisma.$transaction([
      prisma.user.count({ where: { role: "SEKRETARIS_PAC" } }),
      prisma.user.count({ where: { role: "SEKRETARIS_PAC", isActive: true } }),
      prisma.user.count({
        where: { role: "SEKRETARIS_PAC", emailVerified: { not: null } },
      }),
    ]);

    return ok(res, {
      total,
      aktif: active,
      nonaktif: total - active,
      terverifikasi: verified,
      belumVerifikasi: total - verified,
    });
  } catch (err) {
    return next(err);
  }
};

const getUserImage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const data = await prisma.user.findFirst({
      where: { id, role: "SEKRETARIS_PAC" },
      select: { image: true },
    });

    if (!data) {
      const error = new Error("User PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (!data.image) {
      const error = new Error("Gambar belum tersedia");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (data.image.startsWith("http://") || data.image.startsWith("https://")) {
      return res.redirect(data.image);
    }

    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    const filePath = path.isAbsolute(data.image)
      ? data.image
      : path.resolve(process.cwd(), uploadDir, data.image);

    if (!fs.existsSync(filePath)) {
      const error = new Error("File tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return res.sendFile(filePath);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listUserPac,
  getUserPac,
  toggleActiveUserPac,
  resetPasswordUserPac,
  statsUserPac,
  getUserImage,
};
