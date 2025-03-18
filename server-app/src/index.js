import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectMongo } from './db/connectMongo.js';
import { seed } from './scripts/seed.js';
import { apiRouter } from './api/index.js';

const run = async () => {
  const app = express();
  const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_DB,
    MONGO_HOST = 'mongo',
    MONGO_PORT,
    PORT = 8000,
  } = process.env;

  try {
    console.log('Connecting to MongoDB...');
    await connectMongo(MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_HOST, MONGO_PORT);
    console.log('MongoDB connected successfully!');

    if (process.env.NODE_ENV === 'development') {
      await seed();
      console.log('Seed running successfully!');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  // Middlewares
  app.use(
    cors({
      origin: '*',
      credentials: true,
    }),
  );
  app.use(bodyParser.json());

  // Mount routes
  app.use('/api/v1', apiRouter);

  app.use((err, _req, res, next) => {
    const statusCode = err?.statusCode ?? err?.status;
    if (statusCode >= 400 && statusCode < 500) {
      console.warn(`Invalid request: ${JSON.stringify(err)}`);
      res.status(statusCode).send({ message: 'Bad request' });
    } else if (!statusCode || statusCode >= 500) {
      console.error('Internal error', err);
      res.status(statusCode || 500).send({ message: 'Something went wrong' });
    } else {
      next(err);
    }
  });

  app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
};

run();
