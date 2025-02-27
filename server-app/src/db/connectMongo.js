const mongoose = require("mongoose");

module.exports.connectMongo = async (user, pass, db, port) => {
  const uri = `mongodb://${user}:${pass}@mongo:${port}/${db}?authSource=admin`;
  
  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
};
