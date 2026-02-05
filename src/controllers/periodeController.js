const prisma = require("../utils/prisma");
const { ok, created, paginateMeta, parsePagination } = require("../utils/response");
const { broadcastEvent } = require("../realtime/sse");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const buildValidationError = (fields) => {
  const error = new Error("Validasi gagal");
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.details = { fields };
  return error;
};

const listPeriode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = parsePagination(req.query);

    const [total, data] = await prisma.$transaction([
      prisma.periode.count({ where: { userId } }),
      prisma.periode.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    if (total > 0) {
      const active = await prisma.periode.findFirst({
        where: { userId, isActive: true },
      });

      if (!active) {
        const latest = await prisma.periode.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (latest) {
          await prisma.periode.update({
            where: { id: latest.id },
            data: { isActive: true },
          });
        }

        const refreshed = await prisma.periode.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });

        return ok(res, refreshed, "OK", paginateMeta({ page, limit, total }));
      }
    }

    return ok(res, data, "OK", paginateMeta({ page, limit, total }));
  } catch (err) {
    return next(err);
  }
};

const getPeriode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const data = await prisma.periode.findFirst({
      where: { id, userId },
    });

    if (!data) {
      const error = new Error("Periode tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const createPeriode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { nama, isActive } = req.body || {};
    const fields = {};

    if (!isNonEmptyString(nama)) fields.nama = "Nama wajib diisi";
    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const name = nama.trim();
    const duplicate = await prisma.periode.findFirst({
      where: { userId, nama: name },
    });
    if (duplicate) {
      const error = new Error("Periode sudah ada");
      error.statusCode = 409;
      error.code = "VALIDATION_ERROR";
      error.details = { fields: { nama: "Periode sudah ada" } };
      throw error;
    }

    const [existingCount, user] = await prisma.$transaction([
      prisma.periode.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
      }),
    ]);

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
    const active =
      existingCount === 0 ? true : isActive === undefined ? false : Boolean(isActive);

    let data;
    if (active) {
      const [, createdData] = await prisma.$transaction([
        prisma.periode.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        }),
        prisma.periode.create({
          data: { nama: name, isActive: true, userId },
        }),
      ]);
      data = createdData;
    } else {
      data = await prisma.periode.create({
        data: { nama: name, isActive: false, userId },
      });
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "periode", action: "create", data, userId, at: new Date().toISOString() },
      userId,
    });
    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updatePeriode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { nama, isActive } = req.body || {};
    const fields = {};

    if (nama !== undefined && !isNonEmptyString(nama))
      fields.nama = "Nama wajib diisi";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const exists = await prisma.periode.findFirst({ where: { id, userId } });
    if (!exists) {
      const error = new Error("Periode tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const active = isActive === undefined ? undefined : Boolean(isActive);
    const name = nama !== undefined ? nama.trim() : undefined;

    if (name) {
      const duplicate = await prisma.periode.findFirst({
        where: { userId, nama: name, id: { not: id } },
      });
      if (duplicate) {
        const error = new Error("Periode sudah ada");
        error.statusCode = 409;
        error.code = "VALIDATION_ERROR";
        error.details = { fields: { nama: "Periode sudah ada" } };
        throw error;
      }
    }

    if (active) {
      await prisma.$transaction([
        prisma.periode.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        }),
        prisma.periode.update({
          where: { id },
          data: {
            nama: name,
            isActive: true,
          },
        }),
      ]);
    } else {
      await prisma.periode.update({
        where: { id },
        data: {
          nama: name,
          isActive: active,
        },
      });
    }

    const data = await prisma.periode.findUnique({ where: { id } });
    broadcastEvent({
      event: "entity_change",
      payload: { entity: "periode", action: "update", data, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deletePeriode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const current = await prisma.periode.findFirst({
      where: { id, userId },
      select: { isActive: true },
    });

    if (!current) {
      const error = new Error("Periode tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (current.isActive) {
      const error = new Error("Periode aktif tidak bisa dihapus");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      error.details = { fields: { id: "Periode aktif tidak bisa dihapus" } };
      throw error;
    }

    const deleted = await prisma.periode.deleteMany({
      where: { id, userId },
    });

    if (!deleted.count) {
      const error = new Error("Periode tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "periode", action: "delete", data: { id }, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const activatePeriode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const exists = await prisma.periode.findFirst({ where: { id, userId } });
    if (!exists) {
      const error = new Error("Periode tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    await prisma.$transaction([
      prisma.periode.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      prisma.periode.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    const data = await prisma.periode.findUnique({ where: { id } });
    broadcastEvent({
      event: "entity_change",
      payload: { entity: "periode", action: "activate", data, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listPeriode,
  getPeriode,
  createPeriode,
  updatePeriode,
  deletePeriode,
  activatePeriode,
};
