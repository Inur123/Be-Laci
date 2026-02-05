const fs = require("fs");
const path = require("path");
const prisma = require("../utils/prisma");
const { ok, created, paginateMeta } = require("../utils/response");
const { sendEmail } = require("../utils/email");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeEnum = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

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
    await ensureVerified(userId);
    ensureRole(req, ["SEKRETARIS_PAC"]);

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
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
    await ensureVerified(userId);
    ensureRole(req, ["SEKRETARIS_CABANG"]);

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
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
    await ensureVerified(userId);
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
    await ensureVerified(userId);
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

    const pacUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const cabangUsers = await prisma.user.findMany({
      where: {
        role: "SEKRETARIS_CABANG",
        isActive: true,
        emailVerified: { not: null },
      },
      select: { email: true },
    });

    const cabangEmails = cabangUsers
      .map((item) => item.email)
      .filter((email) => isNonEmptyString(email));

    const subjectPac = "Pengajuan PAC berhasil dikirim";
    const subjectCabang = "Pengajuan PAC baru menunggu proses";
    const bodyPac = `
      <p>Pengajuan PAC berhasil dikirim dan akan diproses oleh sekretaris cabang.</p>
      <p>Nomor Surat: ${nomorSurat}</p>
      <p>Penerima: ${normalizedPenerima}</p>
      <p>Tanggal: ${tanggal}</p>
      <p>Keperluan: ${keperluan}</p>
      <p>Status: PENDING</p>
    `;
    const bodyCabang = `
      <p>Ada pengajuan PAC baru dari ${pacUser?.name || "PAC"}.</p>
      <p>Nomor Surat: ${nomorSurat}</p>
      <p>Penerima: ${normalizedPenerima}</p>
      <p>Tanggal: ${tanggal}</p>
      <p>Keperluan: ${keperluan}</p>
      <p>Status: PENDING</p>
    `;

    if (pacUser?.email) {
      try {
        await sendEmail({
          to: pacUser.email,
          subject: subjectPac,
          html: bodyPac,
          text: `Pengajuan PAC berhasil dikirim dan akan diproses oleh sekretaris cabang.
Nomor Surat: ${nomorSurat}
Penerima: ${normalizedPenerima}
Tanggal: ${tanggal}
Keperluan: ${keperluan}
Status: PENDING`,
        });
      } catch (err) {
      }
    }

    if (cabangEmails.length > 0) {
      try {
        await sendEmail({
          to: cabangEmails,
          subject: subjectCabang,
          html: bodyCabang,
          text: `Ada pengajuan PAC baru.
Nomor Surat: ${nomorSurat}
Penerima: ${normalizedPenerima}
Tanggal: ${tanggal}
Keperluan: ${keperluan}
Status: PENDING`,
        });
      } catch (err) {
      }
    }

    return created(res, data);
  } catch (err) {
    return next(err);
  }
};

const updatePengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
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

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const deletePengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
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
    return ok(res, {});
  } catch (err) {
    return next(err);
  }
};

const downloadPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
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

const approvePengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
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

    const periodeCabang = await resolveActivePeriode(userId);
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

    const pacUser = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { email: true, name: true },
    });

    if (pacUser?.email) {
      const subject = "Pengajuan PAC diterima";
      const html = `
        <p>Pengajuan PAC kamu telah diterima oleh sekretaris cabang.</p>
        <p>Nomor Surat: ${existing.nomorSurat}</p>
        <p>Penerima: ${existing.penerima}</p>
        <p>Tanggal: ${existing.tanggal}</p>
        <p>Keperluan: ${existing.keperluan}</p>
        <p>Status: DITERIMA</p>
      `;
      try {
        await sendEmail({
          to: pacUser.email,
          subject,
          html,
          text: `Pengajuan PAC diterima.
Nomor Surat: ${existing.nomorSurat}
Penerima: ${existing.penerima}
Tanggal: ${existing.tanggal}
Keperluan: ${existing.keperluan}
Status: DITERIMA`,
        });
      } catch (err) {
      }
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const rejectPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);
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

    const periodeCabang = await resolveActivePeriode(userId);
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

    const pacUser = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { email: true, name: true },
    });

    if (pacUser?.email) {
      const subject = "Pengajuan PAC ditolak";
      const html = `
        <p>Pengajuan PAC kamu ditolak oleh sekretaris cabang.</p>
        <p>Nomor Surat: ${existing.nomorSurat}</p>
        <p>Penerima: ${existing.penerima}</p>
        <p>Tanggal: ${existing.tanggal}</p>
        <p>Keperluan: ${existing.keperluan}</p>
        <p>Alasan: ${alasanPenolakan}</p>
        <p>Status: DITOLAK</p>
      `;
      try {
        await sendEmail({
          to: pacUser.email,
          subject,
          html,
          text: `Pengajuan PAC ditolak.
Nomor Surat: ${existing.nomorSurat}
Penerima: ${existing.penerima}
Tanggal: ${existing.tanggal}
Keperluan: ${existing.keperluan}
Alasan: ${alasanPenolakan}
Status: DITOLAK`,
        });
      } catch (err) {
      }
    }

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
};

const statsPengajuanPac = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureVerified(userId);

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
