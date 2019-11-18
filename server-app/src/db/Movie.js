const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Movie",
  new mongoose.Schema({
    name: { type: mongoose.Schema.Types.String, required: true },
    description: { type: mongoose.Schema.Types.String, required: true }
  })
);
