const { getFakeMovie } = require("../../fakes/movie");
const Movie = require("../../db/Movie");

module.exports.mountMoviesListRoute = app => {
  app.get("/api/v1/movies", async (_, res) => {
    res.json(await Movie.find({}));
  });
};
