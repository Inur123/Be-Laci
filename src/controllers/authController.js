const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");
const { ok, created } = require("../utils/response");
const {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
} = require("../config/jwt");

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

const toSeconds = (value, fallback = 1800) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) return Number(value);
    if (/^\d+s$/.test(value)) return Number(value.slice(0, -1));
    if (/^\d+m$/.test(value)) return Number(value.slice(0, -1)) * 60;
    if (/^\d+h$/.test(value)) return Number(value.slice(0, -1)) * 3600;
    if (/^\d+d$/.test(value)) return Number(value.slice(0, -1)) * 86400;
  }
  return fallback;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createTokens = (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion },
    accessTokenSecret,
    { expiresIn: accessTokenExpiresIn }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    refreshTokenSecret,
    { expiresIn: refreshTokenExpiresIn }
  );

  const refreshPayload = jwt.decode(refreshToken);
  const expiresAt = new Date(refreshPayload.exp * 1000);

  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, recaptchaToken } = req.body || {};
    const fields = {};
    const normalizedEmail = normalizeEmail(email);

    if (!isNonEmptyString(name) || name.trim().length < 2)
      fields.name = "Nama minimal 2 karakter";
    if (!isEmail(normalizedEmail)) fields.email = "Email tidak valid";
    if (!isNonEmptyString(password) || password.length < 6)
      fields.password = "Password minimal 6 karakter";
    if (!isNonEmptyString(recaptchaToken))
      fields.recaptchaToken = "Recaptcha wajib diisi";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      const error = new Error("Email sudah terdaftar");
      error.statusCode = 409;
      error.code = "VALIDATION_ERROR";
      error.details = { fields: { email: "Email sudah terdaftar" } };
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "SEKRETARIS_PAC",
        isActive: false,
      },
      select: { id: true, role: true, tokenVersion: true },
    });

    const { accessToken, refreshToken, refreshExpiresAt } = createTokens(user);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        userId: user.id,
      },
    });

    return created(res, {
      accessToken,
      refreshToken,
      expiresIn: toSeconds(accessTokenExpiresIn),
    });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, recaptchaToken } = req.body || {};
    const fields = {};
    const normalizedEmail = normalizeEmail(email);

    if (!isEmail(normalizedEmail)) fields.email = "Email tidak valid";
    if (!isNonEmptyString(password)) fields.password = "Password wajib diisi";
    if (!isNonEmptyString(recaptchaToken))
      fields.recaptchaToken = "Recaptcha wajib diisi";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, role: true, passwordHash: true, isActive: true, tokenVersion: true },
    });
    if (!user) {
      const error = new Error("Email atau password salah");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      throw error;
    }

    if (!user.isActive) {
      const error = new Error("Akun tidak aktif");
      error.statusCode = 403;
      error.code = "ROLE_FORBIDDEN";
      throw error;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      const error = new Error("Email atau password salah");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      throw error;
    }

    const { accessToken, refreshToken, refreshExpiresAt } = createTokens(user);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        userId: user.id,
      },
    });

    return ok(res, {
      accessToken,
      refreshToken,
      expiresIn: toSeconds(accessTokenExpiresIn),
    });
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!isNonEmptyString(refreshToken)) {
      throw buildValidationError({ refreshToken: "Refresh token wajib diisi" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, refreshTokenSecret);
    } catch (err) {
      const error = new Error("Token tidak valid");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      throw error;
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });

    if (!stored || stored.expiresAt < new Date()) {
      const error = new Error("Token tidak valid");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      throw error;
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, tokenVersion: true },
    });

    if (!user) {
      const error = new Error("User tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const newTokens = createTokens(user);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(newTokens.refreshToken),
        expiresAt: newTokens.refreshExpiresAt,
        userId: user.id,
      },
    });

    return ok(res, {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: toSeconds(accessTokenExpiresIn),
    });
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!isNonEmptyString(refreshToken)) {
      throw buildValidationError({
        refreshToken: "Refresh token wajib diisi",
      });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, refreshTokenSecret);
    } catch (err) {
      const error = new Error("Token tidak valid");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      throw error;
    }

    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: payload.sub },
      data: { tokenVersion: { increment: 1 } },
    });

    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      const error = new Error("Belum terautentikasi");
      error.statusCode = 401;
      error.code = "UNAUTHORIZED";
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
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

module.exports = { register, login, refresh, logout, me };
