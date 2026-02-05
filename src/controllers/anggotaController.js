const fs = require("fs");
const path = require("path");
const prisma = require("../utils/prisma");
const { ok, created, paginateMeta, parsePagination } = require("../utils/response");
const { broadcastEvent } = require("../realtime/sse");
const { ensureVerifiedUser } = require("../utils/ensureVerified");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const parseDate = (value) => {
  if (!value) return null;
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

const listAnggota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });

    const { page, limit, skip } = parsePagination(req.query);
    const { q, periodeId } = req.query;

    const where = {
      userId,
      ...(isNonEmptyString(periodeId) ? { periodeId } : {}),
      ...(isNonEmptyString(q)
        ? {
            OR: [
              { namaLengkap: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { noHp: { contains: q, mode: "insensitive" } },
              { alamat: { contains: q, mode: "insensitive" } },
              { nik: { contains: q, mode: "insensitive" } },
              { nia: { contains: q, mode: "insensitive" } },
              { tempatLahir: { contains: q, mode: "insensitive" } },
              { jabatan: { contains: q, mode: "insensitive" } },
              { rfid: { contains: q, mode: "insensitive" } },
              { hoby: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.anggota.count({ where }),
      prisma.anggota.findMany({
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

const getAnggota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const data = await prisma.anggota.findFirst({
      where: { id, userId },
    });

    if (!data) {
      const error = new Error("Anggota tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const createAnggota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });

    const {
      namaLengkap,
      jenisKelamin,
      nik,
      nia,
      tanggalLahir,
      tempatLahir,
      jabatan,
      rfid,
      hoby,
      alamat,
      noHp,
      email,
      foto,
      periodeId,
    } = req.body || {};

    const fields = {};

    if (!isNonEmptyString(namaLengkap))
      fields.namaLengkap = "Nama lengkap wajib diisi";
    if (!isNonEmptyString(jenisKelamin))
      fields.jenisKelamin = "Jenis kelamin wajib diisi";
    const parsedTanggalLahir = parseDate(tanggalLahir);

    if (tanggalLahir !== undefined && tanggalLahir && !parsedTanggalLahir)
      fields.tanggalLahir = "Tanggal lahir tidak valid";

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

    const data = await prisma.anggota.create({
      data: {
        namaLengkap: namaLengkap.trim(),
        jenisKelamin: jenisKelamin.trim(),
        nik: nik !== undefined ? (isNonEmptyString(nik) ? nik.trim() : null) : undefined,
        nia: nia !== undefined ? (isNonEmptyString(nia) ? nia.trim() : null) : undefined,
        tanggalLahir:
          tanggalLahir !== undefined
            ? tanggalLahir
              ? parsedTanggalLahir
              : null
            : undefined,
        tempatLahir:
          tempatLahir !== undefined
            ? isNonEmptyString(tempatLahir)
              ? tempatLahir.trim()
              : null
            : undefined,
        jabatan:
          jabatan !== undefined
            ? isNonEmptyString(jabatan)
              ? jabatan.trim()
              : null
            : undefined,
        rfid: rfid !== undefined ? (isNonEmptyString(rfid) ? rfid.trim() : null) : undefined,
        hoby: hoby !== undefined ? (isNonEmptyString(hoby) ? hoby.trim() : null) : undefined,
        alamat:
          alamat !== undefined
            ? isNonEmptyString(alamat)
              ? alamat.trim()
              : null
            : undefined,
        noHp:
          noHp !== undefined ? (isNonEmptyString(noHp) ? noHp.trim() : null) : undefined,
        email:
          email !== undefined ? (isNonEmptyString(email) ? email.trim() : null) : undefined,
        foto: foto !== undefined ? (isNonEmptyString(foto) ? foto : null) : undefined,
        userId,
        periodeId: periode.id,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "anggota", action: "create", data, userId, at: new Date().toISOString() },
      userId,
    });
    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updateAnggota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const {
      namaLengkap,
      jenisKelamin,
      nik,
      nia,
      tanggalLahir,
      tempatLahir,
      jabatan,
      rfid,
      hoby,
      alamat,
      noHp,
      email,
      foto,
      periodeId,
    } = req.body || {};

    const fields = {};

    if (namaLengkap !== undefined && !isNonEmptyString(namaLengkap))
      fields.namaLengkap = "Nama lengkap wajib diisi";
    if (jenisKelamin !== undefined && !isNonEmptyString(jenisKelamin))
      fields.jenisKelamin = "Jenis kelamin wajib diisi";
    const parsedTanggalLahir =
      tanggalLahir !== undefined ? parseDate(tanggalLahir) : undefined;

    if (tanggalLahir !== undefined && tanggalLahir && !parsedTanggalLahir)
      fields.tanggalLahir = "Tanggal lahir tidak valid";

    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const exists = await prisma.anggota.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!exists) {
      const error = new Error("Anggota tidak ditemukan");
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

    const data = await prisma.anggota.update({
      where: { id },
      data: {
        namaLengkap:
          namaLengkap !== undefined
            ? isNonEmptyString(namaLengkap)
              ? namaLengkap.trim()
              : null
            : undefined,
        jenisKelamin:
          jenisKelamin !== undefined
            ? isNonEmptyString(jenisKelamin)
              ? jenisKelamin.trim()
              : null
            : undefined,
        nik: nik !== undefined ? (isNonEmptyString(nik) ? nik.trim() : null) : undefined,
        nia: nia !== undefined ? (isNonEmptyString(nia) ? nia.trim() : null) : undefined,
        tanggalLahir:
          tanggalLahir !== undefined
            ? tanggalLahir
              ? parsedTanggalLahir
              : null
            : undefined,
        tempatLahir:
          tempatLahir !== undefined
            ? isNonEmptyString(tempatLahir)
              ? tempatLahir.trim()
              : null
            : undefined,
        jabatan:
          jabatan !== undefined
            ? isNonEmptyString(jabatan)
              ? jabatan.trim()
              : null
            : undefined,
        rfid: rfid !== undefined ? (isNonEmptyString(rfid) ? rfid.trim() : null) : undefined,
        hoby: hoby !== undefined ? (isNonEmptyString(hoby) ? hoby.trim() : null) : undefined,
        alamat:
          alamat !== undefined ? (isNonEmptyString(alamat) ? alamat.trim() : null) : undefined,
        noHp: noHp !== undefined ? (isNonEmptyString(noHp) ? noHp.trim() : null) : undefined,
        email: email !== undefined ? (isNonEmptyString(email) ? email.trim() : null) : undefined,
        foto: foto !== undefined ? (isNonEmptyString(foto) ? foto : null) : undefined,
        periodeId: periodeId !== undefined ? periode?.id ?? null : undefined,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "anggota", action: "update", data, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deleteAnggota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const deleted = await prisma.anggota.deleteMany({
      where: { id, userId },
    });

    if (!deleted.count) {
      const error = new Error("Anggota tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "anggota", action: "delete", data: { id }, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const statsAnggota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { groupBy } = req.query;

    const [total] = await prisma.$transaction([
      prisma.anggota.count({ where: { userId } }),
    ]);

    let byPeriode = undefined;
    if (groupBy === "periode") {
      const grouped = await prisma.anggota.groupBy({
        by: ["periodeId"],
        where: { userId },
        _count: { _all: true },
      });
      byPeriode = grouped.map((item) => ({
        periodeId: item.periodeId,
        total: item._count._all,
      }));
    }

    return ok(res, {
      total,
      byPeriode,
    });
  } catch (err) {
    return next(err);
  }
};

const getAnggotaImage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const data = await prisma.anggota.findFirst({
      where: { id, userId },
      select: { foto: true },
    });

    if (!data) {
      const error = new Error("Anggota tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (!data.foto) {
      const error = new Error("Gambar belum tersedia");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (data.foto.startsWith("http://") || data.foto.startsWith("https://")) {
      return res.redirect(data.foto);
    }

    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    const filePath = path.isAbsolute(data.foto)
      ? data.foto
      : path.resolve(process.cwd(), uploadDir, data.foto);

    try {
      await fs.promises.access(filePath);
    } catch (err) {
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
  listAnggota,
  getAnggota,
  createAnggota,
  updateAnggota,
  deleteAnggota,
  statsAnggota,
  getAnggotaImage,
};
