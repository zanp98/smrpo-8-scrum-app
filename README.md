# Example MERN stack app with Docker and docker-compose

This repository contains simple project utilizing MERN stack, with all services running in separate docker containers, managed by docker-compose.
Note this project is intended to be a _very_ simple demo how to set up such structure, not a real-life example.

Application consists of server-app (Node + Express), client-app (React) and MongoDb database. Each service runs in its own Docker container.

Both server and client support live-reload of code.

## Setting up

```sh
docker-compose up
```

Server will be accessible at localhost:8000, client at localhost:3000

## Commands

### Seeding database

Seed script in server adds some fake data to the database.

```sh
docker exec -it server-app sh
> npm run seed
```

### Adding packages

node_modules for each package needs to be fully managed inside container, so adding packages must also be performed there.

```sh
docker exec -it client-app sh
> npm i some-package
```
