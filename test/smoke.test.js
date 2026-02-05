const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");

test("GET /health returns OK payload", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { success: true, message: "OK" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
