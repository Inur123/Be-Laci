const fs = require("fs");
const path = require("path");

const ensureUploadDir = async () => {
  const uploadDir = process.env.UPLOAD_DIR || "uploads";
  const resolvedDir = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(process.cwd(), uploadDir);
  await fs.promises.mkdir(resolvedDir, { recursive: true });
  return resolvedDir;
};

module.exports = { ensureUploadDir };
