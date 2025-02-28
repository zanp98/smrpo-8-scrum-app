FROM node:20

# Create app directory
RUN mkdir -p /app
WORKDIR /app

RUN apt-get update

# Add netcat to be able to wait for other services with scripts
RUN apt-get install netcat-traditional

# Install dependencies
COPY package.json .
RUN npm install

RUN npm install -g nodemon

# Copy app source
COPY . .

# Make the wait-for-mongo script executable
# RUN chmod +x ./src/scripts/wait-for-mongo.sh
