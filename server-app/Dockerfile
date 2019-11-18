FROM node:latest

# Create app directory
RUN mkdir -p /usr/app
WORKDIR /usr/app

# Install dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY . .
