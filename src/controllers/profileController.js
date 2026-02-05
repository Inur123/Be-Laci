const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../utils/prisma");
const { ok } = require("../utils/response");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const buildValidationError = (fields) => {
  const error = new Error("Validasi gagal");
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.details = { fields };
  return error;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        image: true,
      },
    });

    if (!user) {
      const error = new Error("User tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, user);
  } catch (err) {
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, image, currentPassword, newPassword } = req.body || {};
    const fields = {};

    if (name !== undefined && !isNonEmptyString(name))
      fields.name = "Nama wajib diisi";
    if (email !== undefined && !isEmail(normalizeEmail(email)))
      fields.email = "Email tidak valid";
    if (newPassword !== undefined && newPassword.length < 6)
      fields.newPassword = "Password minimal 6 karakter";
    if (newPassword !== undefined && !isNonEmptyString(currentPassword))
      fields.currentPassword = "Password lama wajib diisi";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      const error = new Error("User tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    let passwordHash = user.passwordHash;
    if (newPassword !== undefined) {
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        const error = new Error("Password lama salah");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        error.details = { fields: { currentPassword: "Password lama salah" } };
        throw error;
      }
      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    let normalizedEmail = user.email;
    let emailVerified = user.emailVerified;
    let emailVerifyTokenHash = user.emailVerifyTokenHash;
    let emailVerifyExpiresAt = user.emailVerifyExpiresAt;

    if (email !== undefined) {
      normalizedEmail = normalizeEmail(email);
      if (normalizedEmail !== user.email) {
        const exists = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (exists && exists.id !== userId) {
          const error = new Error("Email sudah terdaftar");
          error.statusCode = 409;
          error.code = "VALIDATION_ERROR";
          error.details = { fields: { email: "Email sudah terdaftar" } };
          throw error;
        }

        emailVerified = null;
        emailVerifyTokenHash = null;
        emailVerifyExpiresAt = null;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: normalizedEmail,
        image: image !== undefined && isNonEmptyString(image) ? image : image === "" ? null : undefined,
        passwordHash,
        emailVerified,
        emailVerifyTokenHash,
        emailVerifyExpiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        image: true,
      },
    });

    return ok(res, updated);
  } catch (err) {
    return next(err);
  }
};

const requestEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      const error = new Error("User tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (user.emailVerified) {
      return ok(res, { verified: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const tokenHash = hashToken(token);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyTokenHash: tokenHash,
        emailVerifyExpiresAt: expiresAt,
      },
    });

    return ok(res, {
      verified: false,
      token,
      expiresAt,
    });
  } catch (err) {
    return next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body || {};
    if (!isNonEmptyString(token)) {
      throw buildValidationError({ token: "Token wajib diisi" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerifyTokenHash: true,
        emailVerifyExpiresAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      const error = new Error("User tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (user.emailVerified) {
      return ok(res, { verified: true });
    }

    if (!user.emailVerifyTokenHash || !user.emailVerifyExpiresAt) {
      const error = new Error("Token tidak valid");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    if (user.emailVerifyExpiresAt < new Date()) {
      const error = new Error("Token sudah kedaluwarsa");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    if (hashToken(token) !== user.emailVerifyTokenHash) {
      const error = new Error("Token tidak valid");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        emailVerifyTokenHash: null,
        emailVerifyExpiresAt: null,
      },
    });

    return ok(res, { verified: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  requestEmailVerification,
  verifyEmail,
};
