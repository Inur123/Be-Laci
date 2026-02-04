require("dotenv/config");

const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || "dev_access_secret";
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret";
const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "1800s";
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

module.exports = {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
};
