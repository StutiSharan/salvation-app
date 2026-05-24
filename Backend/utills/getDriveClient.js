const { google } = require("googleapis");
const oauth2Client = require("../config/googleOAuth");
const GoogleToken = require("../models/GoogleToken");

module.exports = async () => {
  const token = await GoogleToken.findOne();
  if (!token) {
    throw new Error("Google Drive not authenticated");
  }

  oauth2Client.setCredentials(token);

  return google.drive({
    version: "v3",
    auth: oauth2Client
  });
};
