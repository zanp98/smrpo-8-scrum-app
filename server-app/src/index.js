const express = require("express");
const { connectMongo } = require("./db/connectMongo");
const cors = require("cors");
const { mountMoviesListRoute } = require("./routes/movies/list");

const run = async () => {
  const app = express();
  const { MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_PORT, PORT } = process.env;

  await connectMongo(MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_PORT);

  app.use(
    cors({
      origin: "*",
      credentials: true
    })
  );

  app.get("/", (_, res) => res.send({ message: "Hello World!" }));

  mountMoviesListRoute(app);

  app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
};

run();
