# Example MERN stack app with Docker and docker-compose

This repository contains simple project utilizing MERN stack, with all services running in separate docker containers, managed by docker-compose.
Please note this project is intended to demo how to set up such structure, not a real-life example.

## Setting up

```sh
docker-compose up
```

After installation is complete visit <http://localhost:8000/api/v1/movies>, you should get empty JSON array.

To add data refer to seed command below.

## Commands

### Seeding database

```sh
docker exec -it server-app sh
> npm run seed
```
