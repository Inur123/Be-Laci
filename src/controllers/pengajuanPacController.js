const fs = require("fs");
const path = require("path");
const prisma = require("../utils/prisma");
const { ok, created, paginateMeta, parsePagination } = require("../utils/response");
const { broadcastEvent } = require("../realtime/sse");
const { enqueueEmail } = require("../utils/email");
const { ensureVerifiedUser } = require("../utils/ensureVerified");
const {
  pengajuanPACUserTemplate,
  pengajuanPACAdminTemplate,
  pengajuanPACUserText,
  pengajuanPACAdminText,
  pengajuanPACStatusTemplate,
  pengajuanPACStatusText,
} = require("../utils/emailTemplates");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeEnum = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID");
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

const ensureRole = (req, allowed) => {
  if (!allowed.includes(req.user.role)) {
    const error = new Error("Akses ditolak");
    error.statusCode = 403;
    error.code = "ROLE_FORBIDDEN";
    throw error;
  }
};

const listPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_PAC"]);

    const { page, limit, skip } = parsePagination(req.query);
    const { q, status, penerima } = req.query;

    const normalizedStatus = isNonEmptyString(status)
      ? normalizeEnum(status)
      : undefined;
    const normalizedPenerima = isNonEmptyString(penerima)
      ? normalizeEnum(penerima)
      : undefined;

    const where = {
      userId,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedPenerima ? { penerima: normalizedPenerima } : {}),
      ...(q
        ? {
            OR: [
              { nomorSurat: { contains: q, mode: "insensitive" } },
              { keperluan: { contains: q, mode: "insensitive" } },
              { deskripsi: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.pengajuanPac.count({ where }),
      prisma.pengajuanPac.findMany({
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

const listPengajuanPacCabang = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_CABANG"]);

    const { page, limit, skip } = parsePagination(req.query);
    const { q, status, penerima, pacId } = req.query;

    const normalizedStatus = isNonEmptyString(status)
      ? normalizeEnum(status)
      : undefined;
    const normalizedPenerima = isNonEmptyString(penerima)
      ? normalizeEnum(penerima)
      : undefined;

    const where = {
      ...(pacId ? { userId: pacId } : {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedPenerima ? { penerima: normalizedPenerima } : {}),
      ...(q
        ? {
            OR: [
              { nomorSurat: { contains: q, mode: "insensitive" } },
              { keperluan: { contains: q, mode: "insensitive" } },
              { deskripsi: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.pengajuanPac.count({ where }),
      prisma.pengajuanPac.findMany({
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

const getPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;

    const isPac = req.user.role === "SEKRETARIS_PAC";
    const where = isPac ? { id, userId } : { id };

    const data = await prisma.pengajuanPac.findFirst({ where });
    if (!data) {
      const error = new Error("Pengajuan PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const createPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_PAC"]);

    const {
      nomorSurat,
      penerima,
      tanggal,
      keperluan,
      deskripsi,
      fileUrl,
      fileName,
      fileMime,
      fileSize,
    } = req.body || {};
    const fields = {};

    if (!isNonEmptyString(nomorSurat))
      fields.nomorSurat = "Nomor surat wajib diisi";
    if (!isNonEmptyString(penerima))
      fields.penerima = "Penerima wajib diisi";
    if (!isNonEmptyString(tanggal)) fields.tanggal = "Tanggal wajib diisi";
    if (!isNonEmptyString(keperluan))
      fields.keperluan = "Keperluan wajib diisi";

    const normalizedPenerima = normalizeEnum(penerima);
    const parsedTanggal = parseDate(tanggal);

    if (penerima && !["IPNU", "IPPNU", "BERSAMA"].includes(normalizedPenerima))
      fields.penerima = "Penerima tidak valid";
    if (tanggal && !parsedTanggal)
      fields.tanggal = "Tanggal tidak valid";
    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const periodePac = await resolveActivePeriode(userId);
    if (!periodePac) {
      const error = new Error("Tidak ada periode aktif");
      error.statusCode = 400;
      error.code = "NO_ACTIVE_PERIODE";
      throw error;
    }

    const data = await prisma.pengajuanPac.create({
      data: {
        nomorSurat: nomorSurat.trim(),
        penerima: normalizedPenerima,
        tanggal: parsedTanggal,
        keperluan: keperluan.trim(),
        deskripsi: isNonEmptyString(deskripsi) ? deskripsi.trim() : deskripsi === "" ? null : undefined,
        status: "PENDING",
        fileUrl: isNonEmptyString(fileUrl) ? fileUrl : fileUrl === "" ? null : undefined,
        fileName: isNonEmptyString(fileName) ? fileName : fileName === "" ? null : undefined,
        fileMime: isNonEmptyString(fileMime) ? fileMime : fileMime === "" ? null : undefined,
        fileSize: typeof fileSize === "number" ? fileSize : undefined,
        userId,
        periodePacId: periodePac.id,
      },
    });

    const [pacUser, cabangUsers] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.user.findMany({
        where: {
          role: "SEKRETARIS_CABANG",
          isActive: true,
          emailVerified: { not: null },
        },
        select: { email: true },
      }),
    ]);

    const cabangEmails = cabangUsers
      .map((item) => item.email)
      .filter((email) => isNonEmptyString(email));

    const appUrl = process.env.APP_URL;
    const detailUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/pengajuan-pac/${data.id}`
      : "";
    const submissionDate = formatDate(parsedTanggal) || formatDate(data.createdAt);
    const pacName = pacUser?.name || "PAC";
    const userName = pacUser?.name || "Pengaju";

    if (pacUser?.email) {
      enqueueEmail({
        to: pacUser.email,
        subject: "Pengajuan PAC berhasil dikirim",
        html: pengajuanPACUserTemplate({
          userName,
          pacName,
          submissionDate,
          detailUrl,
        }),
        text: pengajuanPACUserText({
          userName,
          pacName,
          submissionDate,
          detailUrl,
        }),
      });
    }

    if (cabangEmails.length > 0) {
      enqueueEmail({
        to: cabangEmails,
        subject: "Pengajuan PAC baru menunggu proses",
        html: pengajuanPACAdminTemplate({
          userName,
          pacName,
          submissionDate,
          detailUrl,
        }),
        text: pengajuanPACAdminText({
          userName,
          pacName,
          submissionDate,
          detailUrl,
        }),
      });
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "pengajuan_pac", action: "create", data, userId, at: new Date().toISOString() },
      userId,
    });
    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updatePengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_PAC"]);
    const { id } = req.params;
    const {
      nomorSurat,
      penerima,
      tanggal,
      keperluan,
      deskripsi,
      fileUrl,
      fileName,
      fileMime,
      fileSize,
      status,
    } = req.body || {};
    const fields = {};

    if (status !== undefined) fields.status = "Status tidak bisa diubah";
    if (nomorSurat !== undefined && !isNonEmptyString(nomorSurat))
      fields.nomorSurat = "Nomor surat wajib diisi";
    if (penerima !== undefined && !isNonEmptyString(penerima))
      fields.penerima = "Penerima wajib diisi";
    if (tanggal !== undefined && !isNonEmptyString(tanggal))
      fields.tanggal = "Tanggal wajib diisi";
    if (keperluan !== undefined && !isNonEmptyString(keperluan))
      fields.keperluan = "Keperluan wajib diisi";

    const normalizedPenerima =
      penerima !== undefined ? (isNonEmptyString(penerima) ? normalizeEnum(penerima) : penerima) : undefined;
    const parsedTanggal = tanggal !== undefined ? parseDate(tanggal) : undefined;

    if (isNonEmptyString(penerima) && !["IPNU", "IPPNU", "BERSAMA"].includes(normalizedPenerima))
      fields.penerima = "Penerima tidak valid";
    if (tanggal !== undefined && tanggal && !parsedTanggal)
      fields.tanggal = "Tanggal tidak valid";
    if (Object.keys(fields).length > 0) throw buildValidationError(fields);

    const existing = await prisma.pengajuanPac.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      const error = new Error("Pengajuan PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (existing.status !== "PENDING") {
      const error = new Error("Pengajuan tidak bisa diubah");
      error.statusCode = 400;
      error.code = "INVALID_STATUS_TRANSITION";
      throw error;
    }

    const data = await prisma.pengajuanPac.update({
      where: { id },
      data: {
        nomorSurat:
          nomorSurat !== undefined ? (isNonEmptyString(nomorSurat) ? nomorSurat.trim() : null) : undefined,
        penerima: normalizedPenerima !== undefined ? normalizedPenerima : undefined,
        tanggal: tanggal !== undefined ? (tanggal ? parsedTanggal : null) : undefined,
        keperluan:
          keperluan !== undefined ? (isNonEmptyString(keperluan) ? keperluan.trim() : null) : undefined,
        deskripsi: deskripsi !== undefined ? (isNonEmptyString(deskripsi) ? deskripsi.trim() : null) : undefined,
        fileUrl: fileUrl !== undefined ? (isNonEmptyString(fileUrl) ? fileUrl : null) : undefined,
        fileName: fileName !== undefined ? (isNonEmptyString(fileName) ? fileName : null) : undefined,
        fileMime: fileMime !== undefined ? (isNonEmptyString(fileMime) ? fileMime : null) : undefined,
        fileSize: fileSize !== undefined ? fileSize : undefined,
      },
    });

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "pengajuan_pac", action: "update", data, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deletePengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_PAC"]);
    const { id } = req.params;

    const existing = await prisma.pengajuanPac.findFirst({
      where: { id, userId },
      select: { status: true },
    });
    if (!existing) {
      const error = new Error("Pengajuan PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (existing.status !== "PENDING") {
      const error = new Error("Pengajuan tidak bisa dihapus");
      error.statusCode = 400;
      error.code = "INVALID_STATUS_TRANSITION";
      throw error;
    }

    await prisma.pengajuanPac.deleteMany({ where: { id, userId } });
    broadcastEvent({
      event: "entity_change",
      payload: { entity: "pengajuan_pac", action: "delete", data: { id }, userId, at: new Date().toISOString() },
      userId,
    });
    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const downloadPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    const { id } = req.params;
    const isPac = req.user.role === "SEKRETARIS_PAC";
    const where = isPac ? { id, userId } : { id };

    const data = await prisma.pengajuanPac.findFirst({
      where,
      select: { fileUrl: true, fileName: true },
    });

    if (!data) {
      const error = new Error("Pengajuan PAC tidak ditemukan");
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

const approvePengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_CABANG"]);
    const { id } = req.params;

    const existing = await prisma.pengajuanPac.findFirst({ where: { id } });
    if (!existing) {
      const error = new Error("Pengajuan PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (existing.status !== "PENDING") {
      const error = new Error("Tidak dapat mengubah status");
      error.statusCode = 400;
      error.code = "INVALID_STATUS_TRANSITION";
      throw error;
    }

    const [periodeCabang, pacUser] = await Promise.all([
      resolveActivePeriode(userId),
      prisma.user.findUnique({
        where: { id: existing.userId },
        select: { email: true, name: true },
      }),
    ]);
    if (!periodeCabang) {
      const error = new Error("Tidak ada periode aktif");
      error.statusCode = 400;
      error.code = "NO_ACTIVE_PERIODE";
      throw error;
    }

    const data = await prisma.pengajuanPac.update({
      where: { id },
      data: {
        status: "DITERIMA",
        alasanPenolakan: null,
        periodeCabangId: periodeCabang.id,
      },
    });

    if (pacUser?.email) {
      const appUrl = process.env.APP_URL;
      const detailUrl = appUrl
        ? `${appUrl.replace(/\/$/, "")}/pengajuan-pac/${existing.id}`
        : "";
      const pacName = pacUser?.name || "PAC";
      const userName = pacUser?.name || "Pengaju";
      enqueueEmail({
        to: pacUser.email,
        subject: "Pengajuan PAC diterima",
        html: pengajuanPACStatusTemplate({
          userName,
          pacName,
          status: "DITERIMA",
          detailUrl,
        }),
        text: pengajuanPACStatusText({
          userName,
          pacName,
          status: "DITERIMA",
          detailUrl,
        }),
      });
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "pengajuan_pac", action: "approve", data, userId: existing.userId, at: new Date().toISOString() },
      userId: existing.userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const rejectPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });
    ensureRole(req, ["SEKRETARIS_CABANG"]);
    const { id } = req.params;
    const { alasanPenolakan } = req.body || {};

    if (!isNonEmptyString(alasanPenolakan)) {
      throw buildValidationError({ alasanPenolakan: "Alasan penolakan wajib diisi" });
    }

    const existing = await prisma.pengajuanPac.findFirst({ where: { id } });
    if (!existing) {
      const error = new Error("Pengajuan PAC tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (existing.status !== "PENDING") {
      const error = new Error("Tidak dapat mengubah status");
      error.statusCode = 400;
      error.code = "INVALID_STATUS_TRANSITION";
      throw error;
    }

    const [periodeCabang, pacUser] = await Promise.all([
      resolveActivePeriode(userId),
      prisma.user.findUnique({
        where: { id: existing.userId },
        select: { email: true, name: true },
      }),
    ]);
    if (!periodeCabang) {
      const error = new Error("Tidak ada periode aktif");
      error.statusCode = 400;
      error.code = "NO_ACTIVE_PERIODE";
      throw error;
    }

    const data = await prisma.pengajuanPac.update({
      where: { id },
      data: {
        status: "DITOLAK",
        alasanPenolakan: alasanPenolakan.trim(),
        periodeCabangId: periodeCabang.id,
      },
    });

    if (pacUser?.email) {
      const appUrl = process.env.APP_URL;
      const detailUrl = appUrl
        ? `${appUrl.replace(/\/$/, "")}/pengajuan-pac/${existing.id}`
        : "";
      const pacName = pacUser?.name || "PAC";
      const userName = pacUser?.name || "Pengaju";
      enqueueEmail({
        to: pacUser.email,
        subject: "Pengajuan PAC ditolak",
        html: pengajuanPACStatusTemplate({
          userName,
          pacName,
          status: "DITOLAK",
          alasanPenolakan,
          detailUrl,
        }),
        text: pengajuanPACStatusText({
          userName,
          pacName,
          status: "DITOLAK",
          alasanPenolakan,
          detailUrl,
        }),
      });
    }

    broadcastEvent({
      event: "entity_change",
      payload: { entity: "pengajuan_pac", action: "reject", data, userId: existing.userId, at: new Date().toISOString() },
      userId: existing.userId,
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const statsPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerifiedUser({ userId, emailVerified: req.user.emailVerified });

    const isPac = req.user.role === "SEKRETARIS_PAC";
    const where = isPac ? { userId } : {};

    const [total, byPenerima, byStatus] = await prisma.$transaction([
      prisma.pengajuanPac.count({ where }),
      prisma.pengajuanPac.groupBy({
        by: ["penerima"],
        where,
        _count: { _all: true },
      }),
      prisma.pengajuanPac.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
    ]);

    const penerimaMap = byPenerima.reduce((acc, item) => {
      acc[item.penerima] = item._count._all;
      return acc;
    }, {});

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    return ok(res, {
      total,
      ipnu: penerimaMap.IPNU || 0,
      ippnu: penerimaMap.IPPNU || 0,
      bersama: penerimaMap.BERSAMA || 0,
      pending: statusMap.PENDING || 0,
      diterima: statusMap.DITERIMA || 0,
      ditolak: statusMap.DITOLAK || 0,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listPengajuanPac,
  listPengajuanPacCabang,
  getPengajuanPac,
  createPengajuanPac,
  updatePengajuanPac,
  deletePengajuanPac,
  downloadPengajuanPac,
  approvePengajuanPac,
  rejectPengajuanPac,
  statsPengajuanPac,
};
