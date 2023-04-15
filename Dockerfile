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
RUN npm install

# Copy craco.config.js, public, and src directories
COPY ./app/craco.config.js ./craco.config.js
COPY ./app/public ./public
COPY ./app/src ./src

# Set environment variables
ENV NODE_ENV=production

# Build the application
RUN npm run build

FROM nvidia/cuda:12.1.0-devel-ubuntu20.04 AS server

# Set the working directory
WORKDIR /app

# Update the package index and install required dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    python3-pip \
    openssl

RUN mkdir /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 19.9.0
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

COPY ./server/package.json ./server/tsconfig.json ./

# Install Node.js dependencies from package.json
RUN npm install

# Copy the rest of the application code into the working directory
COPY ./server/src ./src

RUN CI=true sh -c "cd /app && mkdir data && npm run start && rm -rf data"

COPY --from=build /app/build /app/public

LABEL org.opencontainers.image.source="https://github.com/cogentapps/chat-with-gpt"
ENV PORT 3000

CMD ["npm", "run", "start"]
