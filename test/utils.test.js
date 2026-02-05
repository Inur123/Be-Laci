const test = require("node:test");
const assert = require("node:assert/strict");

const { parsePagination } = require("../src/utils/response");
const { ensureVerifiedUser } = require("../src/utils/ensureVerified");

test("parsePagination uses defaults", () => {
  const { page, limit, skip } = parsePagination({});
  assert.equal(page, 1);
  assert.equal(limit, 10);
  assert.equal(skip, 0);
});

test("parsePagination normalizes invalid inputs", () => {
  const { page, limit, skip } = parsePagination({ page: "0", limit: "-5" });
  assert.equal(page, 1);
  assert.equal(limit, 10);
  assert.equal(skip, 0);
});

test("parsePagination caps limit to maxLimit", () => {
  const { limit } = parsePagination({ limit: "1000" }, 100);
  assert.equal(limit, 100);
});

test("ensureVerifiedUser throws when userId missing", async () => {
  await assert.rejects(() => ensureVerifiedUser({}), (err) => {
    assert.equal(err.code, "NOT_FOUND");
    return true;
  });
});

test("ensureVerifiedUser throws when email not verified (fast-path)", async () => {
  await assert.rejects(
    () => ensureVerifiedUser({ userId: "u1", emailVerified: null }),
    (err) => {
      assert.equal(err.code, "EMAIL_NOT_VERIFIED");
      return true;
    }
  );
});

test("ensureVerifiedUser resolves when email verified (fast-path)", async () => {
  await ensureVerifiedUser({ userId: "u1", emailVerified: new Date() });
});
