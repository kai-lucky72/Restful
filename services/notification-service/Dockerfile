# Build context MUST be the repo root.
#   docker build -f services/notification-service/Dockerfile -t fes-notification .
FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
COPY services/notification-service/package*.json /app/services/notification-service/
WORKDIR /app/services/notification-service
RUN npm install --omit=dev
COPY services/notification-service/src /app/services/notification-service/src
ENV NODE_ENV=production
EXPOSE 4006
CMD ["node", "src/server.js"]
