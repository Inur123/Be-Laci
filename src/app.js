const express = require("express");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/v1", routes);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
