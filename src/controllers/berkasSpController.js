const fs = require("fs");
const path = require("path");
const prisma = require("../utils/prisma");
const { ok, created, paginateMeta, parsePagination } = require("../utils/response");
const { ensureVerifiedUser } = require("../utils/ensureVerified");
const { broadcastEvent } = require("../realtime/sse");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeEnum = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildValidationError = (fields) => {
  const error = new Error("Validasi gagal");
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

const listBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });

    const { page, limit, skip } = parsePagination(req.query);
    const { q, periodeId } = req.query;

    const where = {
      userId,
      ...(periodeId ? { periodeId } : {}),
      ...(q
        ? {
            OR: [
              { namaPimpinan: { contains: q, mode: "insensitive" } },
              { catatan: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.berkasSp.count({ where }),
      prisma.berkasSp.findMany({
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

const getBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const data = await prisma.berkasSp.findFirst({
      where: { id, userId },
    });

    if (!data) {
      const error = new Error("Berkas SP tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const createBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const {
      namaPimpinan,
      organisasi,
      tanggalMulai,
      tanggalBerakhir,
      catatan,
      fileUrl,
      fileName,
      fileMime,
      fileSize,
      periodeId,
    } = req.body || {};
    const fields = {};

    if (!isNonEmptyString(namaPimpinan))
      fields.namaPimpinan = "Nama pimpinan wajib diisi";
    if (!isNonEmptyString(organisasi))
      fields.organisasi = "Organisasi wajib diisi";
    if (!isNonEmptyString(tanggalMulai))
      fields.tanggalMulai = "Tanggal mulai wajib diisi";
    if (!isNonEmptyString(tanggalBerakhir))
      fields.tanggalBerakhir = "Tanggal berakhir wajib diisi";

    const normalizedOrg = normalizeEnum(organisasi);
    const parsedMulai = parseDate(tanggalMulai);
    const parsedBerakhir = parseDate(tanggalBerakhir);

    if (organisasi && !["IPNU", "IPPNU"].includes(normalizedOrg))
      fields.organisasi = "Organisasi harus IPNU atau IPPNU";
    if (tanggalMulai && !parsedMulai)
      fields.tanggalMulai = "Tanggal mulai tidak valid";
    if (tanggalBerakhir && !parsedBerakhir)
      fields.tanggalBerakhir = "Tanggal berakhir tidak valid";
    if (parsedMulai && parsedBerakhir && parsedMulai > parsedBerakhir)
      fields.tanggalBerakhir = "Tanggal berakhir harus setelah tanggal mulai";
    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const normalizedPeriodeId =
      isNonEmptyString(periodeId) && periodeId !== "string" ? periodeId : undefined;

    let periode = null;
    if (normalizedPeriodeId) {
      periode = await prisma.periode.findFirst({
        where: { id: normalizedPeriodeId, userId },
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

    const data = await prisma.berkasSp.create({
      data: {
        namaPimpinan: namaPimpinan.trim(),
        organisasi: normalizedOrg,
        tanggalMulai: parsedMulai,
        tanggalBerakhir: parsedBerakhir,
        catatan: isNonEmptyString(catatan) ? catatan.trim() : catatan === "" ? null : undefined,
        fileUrl: isNonEmptyString(fileUrl) ? fileUrl : fileUrl === "" ? null : undefined,
        fileName: isNonEmptyString(fileName) ? fileName : fileName === "" ? null : undefined,
        fileMime: isNonEmptyString(fileMime) ? fileMime : fileMime === "" ? null : undefined,
        fileSize: typeof fileSize === "number" ? fileSize : undefined,
        userId,
        periodeId: periode.id,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "berkas_sp", action: "create", data, userId, at: new Date().toISOString() },
      userId,
    });
    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updateBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;
    const {
      namaPimpinan,
      organisasi,
      tanggalMulai,
      tanggalBerakhir,
      catatan,
      fileUrl,
      fileName,
      fileMime,
      fileSize,
      periodeId,
    } = req.body || {};
    const fields = {};

    if (namaPimpinan !== undefined && !isNonEmptyString(namaPimpinan))
      fields.namaPimpinan = "Nama pimpinan wajib diisi";
    if (organisasi !== undefined && !isNonEmptyString(organisasi))
      fields.organisasi = "Organisasi wajib diisi";
    if (tanggalMulai !== undefined && !isNonEmptyString(tanggalMulai))
      fields.tanggalMulai = "Tanggal mulai wajib diisi";
    if (tanggalBerakhir !== undefined && !isNonEmptyString(tanggalBerakhir))
      fields.tanggalBerakhir = "Tanggal berakhir wajib diisi";

    const normalizedOrg = organisasi ? normalizeEnum(organisasi) : undefined;
    const parsedMulai = tanggalMulai !== undefined ? parseDate(tanggalMulai) : undefined;
    const parsedBerakhir =
      tanggalBerakhir !== undefined ? parseDate(tanggalBerakhir) : undefined;

    if (organisasi && !["IPNU", "IPPNU"].includes(normalizedOrg))
      fields.organisasi = "Organisasi harus IPNU atau IPPNU";
    if (tanggalMulai !== undefined && tanggalMulai && !parsedMulai)
      fields.tanggalMulai = "Tanggal mulai tidak valid";
    if (tanggalBerakhir !== undefined && tanggalBerakhir && !parsedBerakhir)
      fields.tanggalBerakhir = "Tanggal berakhir tidak valid";
    if (parsedMulai && parsedBerakhir && parsedMulai > parsedBerakhir)
      fields.tanggalBerakhir = "Tanggal berakhir harus setelah tanggal mulai";
    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const exists = await prisma.berkasSp.findFirst({ where: { id, userId } });
    if (!exists) {
      const error = new Error("Berkas SP tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    let periode = null;
    if (periodeId !== undefined) {
      const normalizedPeriodeId =
        isNonEmptyString(periodeId) && periodeId !== "string" ? periodeId : null;
      if (normalizedPeriodeId) {
        periode = await prisma.periode.findFirst({
          where: { id: normalizedPeriodeId, userId },
          select: { id: true },
        });
        if (!periode) {
          const error = new Error("Periode tidak ditemukan");
          error.statusCode = 404;
          error.code = "NOT_FOUND";
          throw error;
        }
      }
    }

    const data = await prisma.berkasSp.update({
      where: { id },
      data: {
        namaPimpinan:
          namaPimpinan !== undefined
            ? isNonEmptyString(namaPimpinan)
              ? namaPimpinan.trim()
              : null
            : undefined,
        organisasi: normalizedOrg !== undefined ? normalizedOrg : undefined,
        tanggalMulai: tanggalMulai !== undefined ? (tanggalMulai ? parsedMulai : null) : undefined,
        tanggalBerakhir:
          tanggalBerakhir !== undefined ? (tanggalBerakhir ? parsedBerakhir : null) : undefined,
        catatan: catatan !== undefined ? (isNonEmptyString(catatan) ? catatan.trim() : null) : undefined,
        fileUrl: fileUrl !== undefined ? (isNonEmptyString(fileUrl) ? fileUrl : null) : undefined,
        fileName: fileName !== undefined ? (isNonEmptyString(fileName) ? fileName : null) : undefined,
        fileMime: fileMime !== undefined ? (isNonEmptyString(fileMime) ? fileMime : null) : undefined,
        fileSize: fileSize !== undefined ? fileSize : undefined,
        periodeId: periodeId !== undefined ? (periode ? periode.id : null) : undefined,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "berkas_sp", action: "update", data, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deleteBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const deleted = await prisma.berkasSp.deleteMany({
      where: { id, userId },
    });

    if (!deleted.count) {
      const error = new Error("Berkas SP tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "berkas_sp", action: "delete", data: { id }, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const downloadBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const data = await prisma.berkasSp.findFirst({
      where: { id, userId },
      select: { fileUrl: true, fileName: true },
    });

    if (!data) {
      const error = new Error("Berkas SP tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (!data.fileUrl) {
      const error = new Error("File belum tersedia");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (data.fileUrl.startsWith("http://") || data.fileUrl.startsWith("https://")) {
      return res.redirect(data.fileUrl);
    }

    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    const filePath = path.isAbsolute(data.fileUrl)
      ? data.fileUrl
      : path.resolve(process.cwd(), uploadDir, data.fileUrl);

    try {
      await fs.promises.access(filePath);
    } catch (err) {
      const error = new Error("File tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return res.download(filePath, data.fileName || undefined);
  } catch (err) {
    return next(err);
  }
};

const statsBerkasSp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { groupBy } = req.query;

    const total = await prisma.berkasSp.count({ where: { userId } });
    let byPeriode = undefined;

    if (groupBy === "periode") {
      const grouped = await prisma.berkasSp.groupBy({
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
  listBerkasSp,
  getBerkasSp,
  createBerkasSp,
  updateBerkasSp,
  deleteBerkasSp,
  downloadBerkasSp,
  statsBerkasSp,
};
