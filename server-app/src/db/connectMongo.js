const mongoose = require("mongoose");

/**
 * After calling this function, global mongoose object will have connection initialized.
 */
module.exports.connectMongo = async (user, pass, db, port) => {
  try {
    await mongoose.connect(`mongodb://mongo:${port}`, {
      pass,
      user,
      dbName: db,
      useNewUrlParser: true
    });
  } catch (error) {
    console.error(error);
  }
};
