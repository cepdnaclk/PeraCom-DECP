# ------------- Stage 1 — Builder Stage -------------

FROM node:24-alpine AS builder

WORKDIR /app

# Copy the shared event-bus so npm can resolve @decp/event-bus
COPY shared ./shared

WORKDIR /app/services/notification-service

COPY services/notification-service/package*.json ./

RUN npm install

COPY services/notification-service ./

RUN npm run build

# -------------- Stage 2 — Production Stage -------------

FROM node:24-alpine

WORKDIR /app/services/notification-service

COPY --from=builder /app/shared /app/shared

COPY --from=builder /app/services/notification-service/dist ./dist

COPY services/notification-service/package*.json ./

RUN npm install --omit=dev

CMD ["node", "dist/index.js"]
