FROM node:latest

# Create app directory
RUN mkdir -p /app
WORKDIR /app

RUN apt-get update
# Add netcat to be able to wait for other services with scripts
RUN apt-get install -y netcat

# Install dependencies
COPY package.json .
RUN npm install

