# Use a public Node.js base image
FROM node:20-alpine AS builder

LABEL org.opencontainers.image.source="https://github.com/ipcafrica/gosource-api" \
      org.opencontainers.image.description="Gosource API - Restaurant/Food Delivery Backend" \
      org.opencontainers.image.licenses="PROPRIETARY"

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

RUN rm -rf node_modules && npm install --omit=dev --legacy-peer-deps

FROM node:20-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/ipcafrica/gosource-api" \
      org.opencontainers.image.description="Gosource API - Restaurant/Food Delivery Backend" \
      org.opencontainers.image.licenses="PROPRIETARY"

# Chromium for Puppeteer PDF generation (order/PO invoices).
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

USER node

COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/src/templates ./src/templates

EXPOSE 3000

CMD ["node", "dist/main"]