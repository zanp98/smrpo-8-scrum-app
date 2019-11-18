const { connectMongo } = require("../db/connectMongo");
const { getFakeMovie } = require("../fakes/movie");
const Movie = require("../db/Movie");

const MOVIES_COUNT = 10;

const seed = async () => {
  try {
    const { MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_PORT } = process.env;
    await connectMongo(MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_PORT);
    const movies = Array.from({ length: MOVIES_COUNT }, () => getFakeMovie());

    console.log("Inserting movies...");
    const { insertedCount } = await Movie.collection.insertMany(movies);

    console.log(`Successfully inserted ${insertedCount} movies!`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
};

seed();
