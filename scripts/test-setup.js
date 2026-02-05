const { execSync } = require("node:child_process");

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (hasDatabaseUrl) {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
