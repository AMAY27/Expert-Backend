# Base node runtime image
FROM node:18-alpine

# Setting working directory to /app inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the required dependencies in the container
RUN npm install

# Copy the remaining code of the application from host machine to the /app directory inside the docker container
COPY . .

# Build the applicaiton inside docker container
RUN npm run build

# Start the backend server in development mode
CMD [ "npm", "start" ]