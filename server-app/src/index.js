const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { mountAuthRoutes } = require("./routes/auth");
const { mountProjectRoutes } = require("./routes/projects");
const { mountSprintRoutes } = require("./routes/sprints");
const { mountTaskRoutes } = require("./routes/tasks");
const { connectMongo } = require('./db/connectMongo');
const seed = require('./scripts/seed'); // Import the seed script

const run = async () => {
  const app = express();
  const port = process.env.PORT || 5000;
  const { MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_PORT, PORT } = process.env;

  try {
    console.log("Connecting to MongoDB...");
    await connectMongo(MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_PORT);
    console.log("MongoDB connected successfully!");

    if (process.env.NODE_ENV === 'development') {
      await seed();
      console.log("Seed running successfully!");
    }
    
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  // Middleware
  app.use(
    cors({
      origin: "*",
      credentials: true
    })
  );
  app.use(bodyParser.json());


  // Mount routes
  mountAuthRoutes(app);
  mountProjectRoutes(app);
  mountSprintRoutes(app);
  mountTaskRoutes(app);

  app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
};

run();
