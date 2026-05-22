# Use a public Node.js base image
FROM node:20-alpine AS builder

LABEL org.opencontainers.image.source="https://github.com/ipcafrica/gosource-api" \
      org.opencontainers.image.description="Gosource API - Restaurant/Food Delivery Backend" \
      org.opencontainers.image.licenses="PROPRIETARY"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN rm -rf node_modules && npm ci --omit=dev

FROM node:20-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/ipcafrica/gosource-api" \
      org.opencontainers.image.description="Gosource API - Restaurant/Food Delivery Backend" \
      org.opencontainers.image.licenses="PROPRIETARY"

WORKDIR /app

USER node

COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/src/templates ./src/templates

EXPOSE 3000

CMD ["node", "dist/main"]