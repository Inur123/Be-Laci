const fs = require("fs");
const path = require("path");
const prisma = require("../utils/prisma");
const { ok, created, paginateMeta } = require("../utils/response");

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

const listArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
    const { periodeId, q } = req.query;

    const where = {
      userId,
      ...(periodeId ? { periodeId } : {}),
      ...(q
        ? {
            OR: [
              { perihal: { contains: q, mode: "insensitive" } },
              { nomorSurat: { contains: q, mode: "insensitive" } },
              { penerimaPengirim: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.arsipSurat.count({ where }),
      prisma.arsipSurat.findMany({
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

const getArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const data = await prisma.arsipSurat.findFirst({
      where: { id, userId },
    });

    if (!data) {
      const error = new Error("Arsip surat tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const createArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const {
      nomorSurat,
      jenisSurat,
      organisasi,
      tanggalSurat,
      penerimaPengirim,
      perihal,
      deskripsi,
      fileUrl,
      fileName,
      fileMime,
      fileSize,
      periodeId,
    } = req.body || {};
    const fields = {};

    if (!isNonEmptyString(nomorSurat))
      fields.nomorSurat = "Nomor surat wajib diisi";
    if (!isNonEmptyString(jenisSurat))
      fields.jenisSurat = "Jenis surat wajib diisi";
    if (!isNonEmptyString(tanggalSurat))
      fields.tanggalSurat = "Tanggal surat wajib diisi";
    if (!isNonEmptyString(penerimaPengirim))
      fields.penerimaPengirim = "Penerima/Pengirim wajib diisi";
    if (!isNonEmptyString(perihal)) fields.perihal = "Perihal wajib diisi";

    const normalizedJenis = normalizeEnum(jenisSurat);
    const normalizedOrg = isNonEmptyString(organisasi)
      ? normalizeEnum(organisasi)
      : null;
    const parsedTanggal = parseDate(tanggalSurat);

    if (jenisSurat && !["MASUK", "KELUAR"].includes(normalizedJenis))
      fields.jenisSurat = "Jenis surat harus MASUK atau KELUAR";
    if (isNonEmptyString(organisasi) && !["IPNU", "IPPNU", "BERSAMA"].includes(normalizedOrg))
      fields.organisasi = "Organisasi tidak valid";
    if (tanggalSurat && !parsedTanggal)
      fields.tanggalSurat = "Tanggal surat tidak valid";
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
      periode = await prisma.periode.findFirst({
        where: { userId, isActive: true },
        select: { id: true },
      });
      if (!periode) {
        const latest = await prisma.periode.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

        if (!latest) {
          const error = new Error("Periode aktif belum ada");
          error.statusCode = 400;
          error.code = "VALIDATION_ERROR";
          error.details = { fields: { periodeId: "Periode aktif belum ada" } };
          throw error;
        }

        await prisma.periode.update({
          where: { id: latest.id },
          data: { isActive: true },
        });

        periode = latest;
      }
    }

    const data = await prisma.arsipSurat.create({
      data: {
        nomorSurat: nomorSurat.trim(),
        jenisSurat: normalizedJenis,
        organisasi: normalizedOrg,
        tanggalSurat: parsedTanggal,
        penerimaPengirim: penerimaPengirim.trim(),
        perihal: perihal.trim(),
        deskripsi: isNonEmptyString(deskripsi) ? deskripsi.trim() : deskripsi === "" ? null : undefined,
        fileUrl: isNonEmptyString(fileUrl) ? fileUrl : fileUrl === "" ? null : undefined,
        fileName: isNonEmptyString(fileName) ? fileName : fileName === "" ? null : undefined,
        fileMime: isNonEmptyString(fileMime) ? fileMime : fileMime === "" ? null : undefined,
        fileSize: typeof fileSize === "number" ? fileSize : undefined,
        userId,
        periodeId: periode.id,
      },
    });

    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updateArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;
    const {
      nomorSurat,
      jenisSurat,
      organisasi,
      tanggalSurat,
      penerimaPengirim,
      perihal,
      deskripsi,
      fileUrl,
      fileName,
      fileMime,
      fileSize,
      periodeId,
    } = req.body || {};
    const fields = {};

    if (nomorSurat !== undefined && !isNonEmptyString(nomorSurat))
      fields.nomorSurat = "Nomor surat wajib diisi";
    if (jenisSurat !== undefined && !isNonEmptyString(jenisSurat))
      fields.jenisSurat = "Jenis surat wajib diisi";
    if (tanggalSurat !== undefined && !isNonEmptyString(tanggalSurat))
      fields.tanggalSurat = "Tanggal surat wajib diisi";
    if (penerimaPengirim !== undefined && !isNonEmptyString(penerimaPengirim))
      fields.penerimaPengirim = "Penerima/Pengirim wajib diisi";
    if (perihal !== undefined && !isNonEmptyString(perihal))
      fields.perihal = "Perihal wajib diisi";

    const normalizedJenis = jenisSurat ? normalizeEnum(jenisSurat) : undefined;
    const normalizedOrg = isNonEmptyString(organisasi)
      ? normalizeEnum(organisasi)
      : organisasi === ""
      ? null
      : undefined;
    const parsedTanggal = tanggalSurat !== undefined ? parseDate(tanggalSurat) : undefined;

    if (jenisSurat && !["MASUK", "KELUAR"].includes(normalizedJenis))
      fields.jenisSurat = "Jenis surat harus MASUK atau KELUAR";
    if (isNonEmptyString(organisasi) && !["IPNU", "IPPNU", "BERSAMA"].includes(normalizedOrg))
      fields.organisasi = "Organisasi tidak valid";
    if (tanggalSurat !== undefined && tanggalSurat && !parsedTanggal)
      fields.tanggalSurat = "Tanggal surat tidak valid";
    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const exists = await prisma.arsipSurat.findFirst({ where: { id, userId } });
    if (!exists) {
      const error = new Error("Arsip surat tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    let periode = null;
    if (periodeId) {
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
    }

    const data = await prisma.arsipSurat.update({
      where: { id },
      data: {
        nomorSurat:
          nomorSurat !== undefined ? (isNonEmptyString(nomorSurat) ? nomorSurat.trim() : null) : undefined,
        jenisSurat: normalizedJenis !== undefined ? normalizedJenis : undefined,
        organisasi: organisasi !== undefined ? normalizedOrg : undefined,
        tanggalSurat:
          tanggalSurat !== undefined ? (tanggalSurat ? parsedTanggal : null) : undefined,
        penerimaPengirim:
          penerimaPengirim !== undefined
            ? (isNonEmptyString(penerimaPengirim) ? penerimaPengirim.trim() : null)
            : undefined,
        perihal:
          perihal !== undefined ? (isNonEmptyString(perihal) ? perihal.trim() : null) : undefined,
        deskripsi: deskripsi !== undefined ? (isNonEmptyString(deskripsi) ? deskripsi.trim() : null) : undefined,
        fileUrl: fileUrl !== undefined ? (isNonEmptyString(fileUrl) ? fileUrl : null) : undefined,
        fileName: fileName !== undefined ? (isNonEmptyString(fileName) ? fileName : null) : undefined,
        fileMime: fileMime !== undefined ? (isNonEmptyString(fileMime) ? fileMime : null) : undefined,
        fileSize: fileSize !== undefined ? fileSize : undefined,
        periodeId: periode ? periode.id : periodeId === null ? null : undefined,
      },
    });

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deleteArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const deleted = await prisma.arsipSurat.deleteMany({
      where: { id, userId },
    });

    if (!deleted.count) {
      const error = new Error("Arsip surat tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const downloadArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { id } = req.params;

    const data = await prisma.arsipSurat.findFirst({
      where: { id, userId },
      select: { fileUrl: true, fileName: true },
    });

    if (!data) {
      const error = new Error("Arsip surat tidak ditemukan");
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

    if (!fs.existsSync(filePath)) {
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

const statsArsipSurat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
    const { groupBy } = req.query;

    const total = await prisma.arsipSurat.count({ where: { userId } });
    let byPeriode = undefined;

    if (groupBy === "periode") {
      const grouped = await prisma.arsipSurat.groupBy({
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
  listArsipSurat,
  getArsipSurat,
  createArsipSurat,
  updateArsipSurat,
  deleteArsipSurat,
  downloadArsipSurat,
  statsArsipSurat,
};
