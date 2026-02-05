const prisma = require("../utils/prisma");
const { ok, created, paginateMeta, parsePagination } = require("../utils/response");
const { ensureVerifiedUser } = require("../utils/ensureVerified");
const { broadcastEvent } = require("../realtime/sse");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const month = parseInt(slashMatch[2], 10);
      const year = parseInt(slashMatch[3], 10);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildValidationError = (fields, message = "Validasi gagal") => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.details = { fields };
  return error;
};

const resolveActivePeriode = async (userId) => {
  let periode = await prisma.periode.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });

  if (!periode) {
    const latest = await prisma.periode.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!latest) return null;

    await prisma.periode.update({
      where: { id: latest.id },
      data: { isActive: true },
    });

    periode = latest;
  }

  return periode;
};

const listKegiatan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });

    const { page, limit, skip } = parsePagination(req.query);
    const { q, periodeId, tanggal } = req.query;

    const parsedTanggal = isNonEmptyString(tanggal) ? parseDate(tanggal) : null;
    const tanggalFilter = parsedTanggal
      ? {
          gte: new Date(
            parsedTanggal.getFullYear(),
            parsedTanggal.getMonth(),
            parsedTanggal.getDate()
          ),
          lt: new Date(
            parsedTanggal.getFullYear(),
            parsedTanggal.getMonth(),
            parsedTanggal.getDate() + 1
          ),
        }
      : null;

    const where = {
      userId,
      ...(isNonEmptyString(periodeId) ? { periodeId } : {}),
      ...(tanggalFilter ? { tanggalPelaksanaan: tanggalFilter } : {}),
      ...(isNonEmptyString(q)
        ? {
            OR: [
              { judul: { contains: q, mode: "insensitive" } },
              { lokasi: { contains: q, mode: "insensitive" } },
              { deskripsi: { contains: q, mode: "insensitive" } },
              { warnaLabel: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.kegiatan.count({ where }),
      prisma.kegiatan.findMany({
        where,
        orderBy: { tanggalPelaksanaan: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return ok(res, data, "OK", paginateMeta({ page, limit, total }));
  } catch (err) {
    return next(err);
  }
};

const getKegiatan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const data = await prisma.kegiatan.findFirst({
      where: { id, userId },
    });

    if (!data) {
      const error = new Error("Kegiatan tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const createKegiatan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });

    const {
      judul,
      tanggalPelaksanaan,
      lokasi,
      waktuMulai,
      waktuSelesai,
      deskripsi,
      warnaLabel,
      periodeId,
    } = req.body || {};

    const fields = {};

    if (!isNonEmptyString(judul)) fields.judul = "Judul kegiatan wajib diisi";
    if (!isNonEmptyString(tanggalPelaksanaan))
      fields.tanggalPelaksanaan = "Tanggal pelaksanaan wajib diisi";

    const parsedTanggal = parseDate(tanggalPelaksanaan);
    if (tanggalPelaksanaan && !parsedTanggal)
      fields.tanggalPelaksanaan = "Tanggal pelaksanaan tidak valid";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    let periode = null;
    if (isNonEmptyString(periodeId) && periodeId !== "string") {
      periode = await prisma.periode.findFirst({
        where: { id: periodeId, userId },
        select: { id: true },
      });
      if (!periode) {
        const error = new Error("Periode tidak ditemukan");
        error.statusCode = 404;
        error.code = "NOT_FOUND";
        throw error;
      }
    } else {
      periode = await resolveActivePeriode(userId);
      if (!periode) {
        const error = new Error("Periode aktif belum ada");
        error.statusCode = 400;
        error.code = "VALIDATION_ERROR";
        error.details = { fields: { periodeId: "Periode aktif belum ada" } };
        throw error;
      }
    }

    const data = await prisma.kegiatan.create({
      data: {
        judul: judul.trim(),
        tanggalPelaksanaan: parsedTanggal,
        lokasi:
          lokasi !== undefined ? (isNonEmptyString(lokasi) ? lokasi.trim() : null) : undefined,
        waktuMulai:
          waktuMulai !== undefined
            ? isNonEmptyString(waktuMulai)
              ? waktuMulai.trim()
              : null
            : undefined,
        waktuSelesai:
          waktuSelesai !== undefined
            ? isNonEmptyString(waktuSelesai)
              ? waktuSelesai.trim()
              : null
            : undefined,
        deskripsi:
          deskripsi !== undefined
            ? isNonEmptyString(deskripsi)
              ? deskripsi.trim()
              : null
            : undefined,
        warnaLabel:
          warnaLabel !== undefined
            ? isNonEmptyString(warnaLabel)
              ? warnaLabel.trim()
              : null
            : undefined,
        userId,
        periodeId: periode.id,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "kegiatan", action: "create", data, userId, at: new Date().toISOString() },
      userId,
    });
    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updateKegiatan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const {
      judul,
      tanggalPelaksanaan,
      lokasi,
      waktuMulai,
      waktuSelesai,
      deskripsi,
      warnaLabel,
      periodeId,
    } = req.body || {};

    const fields = {};

    if (judul !== undefined && !isNonEmptyString(judul))
      fields.judul = "Judul kegiatan wajib diisi";
    if (tanggalPelaksanaan !== undefined && !isNonEmptyString(tanggalPelaksanaan))
      fields.tanggalPelaksanaan = "Tanggal pelaksanaan wajib diisi";

    const parsedTanggal =
      tanggalPelaksanaan !== undefined ? parseDate(tanggalPelaksanaan) : undefined;

    if (tanggalPelaksanaan !== undefined && tanggalPelaksanaan && !parsedTanggal)
      fields.tanggalPelaksanaan = "Tanggal pelaksanaan tidak valid";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const exists = await prisma.kegiatan.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!exists) {
      const error = new Error("Kegiatan tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    let periode = null;
    if (periodeId !== undefined) {
      if (isNonEmptyString(periodeId)) {
        periode = await prisma.periode.findFirst({
          where: { id: periodeId, userId },
          select: { id: true },
        });
        if (!periode) {
          const error = new Error("Periode tidak ditemukan");
          error.statusCode = 404;
          error.code = "NOT_FOUND";
          throw error;
        }
      } else {
        periode = { id: null };
      }
    }

    const data = await prisma.kegiatan.update({
      where: { id },
      data: {
        judul: judul !== undefined ? (isNonEmptyString(judul) ? judul.trim() : null) : undefined,
        tanggalPelaksanaan:
          tanggalPelaksanaan !== undefined
            ? tanggalPelaksanaan
              ? parsedTanggal
              : null
            : undefined,
        lokasi:
          lokasi !== undefined ? (isNonEmptyString(lokasi) ? lokasi.trim() : null) : undefined,
        waktuMulai:
          waktuMulai !== undefined
            ? isNonEmptyString(waktuMulai)
              ? waktuMulai.trim()
              : null
            : undefined,
        waktuSelesai:
          waktuSelesai !== undefined
            ? isNonEmptyString(waktuSelesai)
              ? waktuSelesai.trim()
              : null
            : undefined,
        deskripsi:
          deskripsi !== undefined
            ? isNonEmptyString(deskripsi)
              ? deskripsi.trim()
              : null
            : undefined,
        warnaLabel:
          warnaLabel !== undefined
            ? isNonEmptyString(warnaLabel)
              ? warnaLabel.trim()
              : null
            : undefined,
        periodeId: periodeId !== undefined ? periode?.id ?? null : undefined,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "kegiatan", action: "update", data, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deleteKegiatan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const deleted = await prisma.kegiatan.deleteMany({
      where: { id, userId },
    });

    if (!deleted.count) {
      const error = new Error("Kegiatan tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "kegiatan", action: "delete", data: { id }, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const statsKegiatan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { groupBy } = req.query;

    const total = await prisma.kegiatan.count({ where: { userId } });
    let byPeriode = undefined;

    if (groupBy === "periode") {
      const grouped = await prisma.kegiatan.groupBy({
        by: ["periodeId"],
        where: { userId },
        _count: { _all: true },
      });
      byPeriode = grouped.map((item) => ({
        periodeId: item.periodeId,
        total: item._count._all,
      }));
    }

    return ok(res, { total, byPeriode });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listKegiatan,
  getKegiatan,
  createKegiatan,
  updateKegiatan,
  deleteKegiatan,
  statsKegiatan,
};
