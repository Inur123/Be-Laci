const prisma = require("./prisma");

const buildNotFoundError = () => {
  const error = new Error("User tidak ditemukan");
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  return error;
};

const buildNotVerifiedError = () => {
  const error = new Error("Email belum terverifikasi");
  error.statusCode = 403;
  error.code = "EMAIL_NOT_VERIFIED";
  return error;
};

const ensureVerifiedUser = async ({ userId, emailVerified } = {}) => {
  if (!userId) throw buildNotFoundError();
  if (emailVerified !== undefined) {
    if (!emailVerified) throw buildNotVerifiedError();
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user) throw buildNotFoundError();
  if (!user.emailVerified) throw buildNotVerifiedError();
};

module.exports = { ensureVerifiedUser };
