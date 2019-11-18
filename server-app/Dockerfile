FROM node:latest

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install
