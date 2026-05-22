# Use a Node.js base image
FROM dhi.io/node:24.14-alpine3.23-sfw-dev AS builder

# Security labels
LABEL org.opencontainers.image.source="https://github.com/ipcafrica/gosource-api" \
      org.opencontainers.image.description="Gosource API - Restaurant/Food Delivery Backend" \
      org.opencontainers.image.licenses="PROPRIETARY"

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install NestJS dependencies
RUN npm ci

# Copy the entire application to the working directory
COPY . .

# Build the NestJS application
RUN npm run build

# Remove dev dependencies so node_modules is prod-only
RUN rm -rf node_modules && npm ci --omit=dev

# Start a new stage for a smaller final image
FROM dhi.io/node:24.14-alpine3.23

# Security labels (repeated for final image)
LABEL org.opencontainers.image.source="https://github.com/ipcafrica/gosource-api" \
      org.opencontainers.image.description="Gosource API - Restaurant/Food Delivery Backend" \
      org.opencontainers.image.licenses="PROPRIETARY"

WORKDIR /app

# Use built-in node user from DHI image
USER node

# Copy pruned node_modules, built app, and templates from builder
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/src/templates ./src/templates

# Expose the port the app runs on
EXPOSE 3000

ENTRYPOINT ["node", "dist/main"]