# Build Stage
FROM node:19-bullseye-slim AS build

RUN apt-get update && \
    apt-get install -y \
    git

# Set working directory
WORKDIR /app

# Copy package.json and tsconfig.json
COPY ./app/package.json ./
COPY ./app/tsconfig.json ./

# Install Node.js dependencies
RUN npm install --legacy-peer-deps

COPY ./app/vite.config.js ./

# Copy public, and src directories
COPY ./app/public ./public
COPY ./app/src ./src
COPY ./app/index.html ./

# Set environment variables
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Server Stage
FROM node:19-bullseye-slim AS server

# Set the working directory
WORKDIR /app

COPY ./server/package.json ./server/tsconfig.json ./

# Install Node.js dependencies from package.json
RUN npm install --legacy-peer-deps

# Copy the rest of the application code into the working directory
COPY ./server/src ./src

# Run the server
RUN CI=true sh -c "cd /app && npm run start && rm -rf data"

# Copy the built application from the build stage
COPY --from=build /app/build /app/public

LABEL org.opencontainers.image.source="https://github.com/cogentapps/chat-with-gpt"
ENV PORT 3000

CMD ["npm", "run", "start"]
