const app = require("./app");
const { ensureUploadDir } = require("./utils/uploads");

const port = process.env.PORT || 3000;

ensureUploadDir()
  .catch(() => {
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Server berjalan di port ${port}`);
    });
  });
