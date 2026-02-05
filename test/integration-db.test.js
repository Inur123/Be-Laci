const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../src/app");
const prisma = require("../src/utils/prisma");
const { accessTokenSecret } = require("../src/config/jwt");

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const createToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion },
    accessTokenSecret,
    { expiresIn: "1h" }
  );

const cleanupUserData = async (userId) => {
  await prisma.$transaction([
    prisma.logActivity.deleteMany({ where: { userId } }),
    prisma.pengajuanPac.deleteMany({ where: { userId } }),
    prisma.arsipSurat.deleteMany({ where: { userId } }),
    prisma.anggota.deleteMany({ where: { userId } }),
    prisma.kegiatan.deleteMany({ where: { userId } }),
    prisma.berkasSp.deleteMany({ where: { userId } }),
    prisma.berkasPimpinan.deleteMany({ where: { userId } }),
    prisma.periode.deleteMany({ where: { userId } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.user.deleteMany({ where: { id: userId } }),
  ]);
};

const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

let user;
let token;
let periode;
const createdIds = {};

test.before(async () => {
  if (!hasDatabaseUrl) return;
  user = await prisma.user.create({
    data: {
      name: "Test User",
      email: `test-${uniqueSuffix}@example.com`,
      passwordHash: "hash",
      role: "SEKRETARIS_PAC",
      isActive: true,
      emailVerified: new Date(),
    },
  });
  periode = await prisma.periode.create({
    data: {
      nama: `Periode ${uniqueSuffix}`,
      isActive: true,
      userId: user.id,
    },
  });
  token = createToken(user);
});

test.after(async () => {
  if (!hasDatabaseUrl || !user?.id) return;
  await cleanupUserData(user.id);
  await prisma.$disconnect();
});

test(
  "create and list anggota",
  { skip: !hasDatabaseUrl },
  async () => {
    const createRes = await request(app)
      .post("/v1/anggota")
      .set("Authorization", `Bearer ${token}`)
      .send({
        namaLengkap: "Anggota Test",
        jenisKelamin: "L",
        periodeId: periode.id,
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body?.success, true);
    createdIds.anggotaId = createRes.body.data.id;

    const listRes = await request(app)
      .get("/v1/anggota")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body?.success, true);
    assert.ok(listRes.body?.data?.some((item) => item.id === createdIds.anggotaId));
  }
);

test(
  "create and list arsip surat",
  { skip: !hasDatabaseUrl },
  async () => {
    const createRes = await request(app)
      .post("/v1/arsip-surat")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nomorSurat: `AS-${uniqueSuffix}`,
        jenisSurat: "MASUK",
        organisasi: "IPNU",
        tanggalSurat: "2025-02-05",
        penerimaPengirim: "Penerima",
        perihal: "Perihal Test",
        periodeId: periode.id,
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body?.success, true);
    createdIds.arsipId = createRes.body.data.id;

    const listRes = await request(app)
      .get("/v1/arsip-surat")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body?.success, true);
    assert.ok(listRes.body?.data?.some((item) => item.id === createdIds.arsipId));
  }
);

test(
  "create and list pengajuan PAC",
  { skip: !hasDatabaseUrl },
  async () => {
    const createRes = await request(app)
      .post("/v1/pengajuan-pac")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nomorSurat: `PAC-${uniqueSuffix}`,
        penerima: "IPNU",
        tanggal: "2025-02-05",
        keperluan: "Keperluan Test",
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body?.success, true);
    createdIds.pengajuanId = createRes.body.data.id;

    const listRes = await request(app)
      .get("/v1/pengajuan-pac")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body?.success, true);
    assert.ok(listRes.body?.data?.some((item) => item.id === createdIds.pengajuanId));
  }
);
