# Build context MUST be the repo root.
#   docker build -f services/user-service/Dockerfile -t fes-user .
FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
COPY services/user-service/package*.json /app/services/user-service/
WORKDIR /app/services/user-service
RUN npm install --omit=dev
COPY services/user-service/src /app/services/user-service/src
ENV NODE_ENV=production
EXPOSE 4002
CMD ["node", "src/server.js"]
