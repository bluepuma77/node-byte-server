# Specify the base image
FROM node:22-alpine

# set env
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of application's source code
COPY src/ ./src

# Expose the port the app runs on
EXPOSE 3000

# Command to run your app
CMD ["node", "src/index.js"]