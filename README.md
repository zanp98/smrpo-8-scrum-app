# SCRUM Tool with User Management

This repository contains a SCRUM tool application with user management functionality built using the MERN stack (MongoDB, Express, React, Node.js). All services run in separate Docker containers, managed by docker-compose.

## Features

  - Add new users with username, password, personal information, and system roles
  - View list of all users
  - Delete users

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
