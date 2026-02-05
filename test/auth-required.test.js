const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

const assertUnauthorized = async (path, method = "get") => {
  const res = await request(app)[method](path);
  assert.equal(res.status, 401);
  assert.equal(res.body?.success, false);
  assert.equal(res.body?.error?.code, "UNAUTHORIZED");
};

test("authRequired blocks anggota endpoints without token", async () => {
  await assertUnauthorized("/v1/anggota");
  await assertUnauthorized("/v1/anggota/stats");
});

test("authRequired blocks periode endpoints without token", async () => {
  await assertUnauthorized("/v1/periodes");
  await assertUnauthorized("/v1/periodes/123");
});

test("authRequired blocks profile endpoints without token", async () => {
  await assertUnauthorized("/v1/profile");
  await assertUnauthorized("/v1/profile", "put");
});

test("authRequired blocks user PAC endpoints without token", async () => {
  await assertUnauthorized("/v1/users/pac");
  await assertUnauthorized("/v1/users/pac/123");
});

test("authRequired blocks pengajuan PAC endpoints without token", async () => {
  await assertUnauthorized("/v1/pengajuan-pac");
  await assertUnauthorized("/v1/pengajuan-pac/123");
});

test("authRequired blocks berkas endpoints without token", async () => {
  await assertUnauthorized("/v1/berkas-sp");
  await assertUnauthorized("/v1/berkas-pimpinan");
});
