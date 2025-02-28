import mongoose from 'mongoose';

export const connectMongo = async (user, pass, db, host, port) => {
  const uri = `mongodb://${user}:${pass}@${host}:${port}/${db}?authSource=admin`;
  return mongoose.connect(uri);
};
