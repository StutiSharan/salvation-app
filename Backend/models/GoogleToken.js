const mongoose = require("mongoose");

const GoogleTokenSchema = new mongoose.Schema({
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expiry_date: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GoogleToken", GoogleTokenSchema);
