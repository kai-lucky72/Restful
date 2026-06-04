# Build context MUST be the repo root.
#   docker build -f services/extinguisher-service/Dockerfile -t fes-extinguisher .
FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
COPY services/extinguisher-service/package*.json /app/services/extinguisher-service/
WORKDIR /app/services/extinguisher-service
RUN npm install --omit=dev
COPY services/extinguisher-service/src /app/services/extinguisher-service/src
ENV NODE_ENV=production
EXPOSE 4003
CMD ["node", "src/server.js"]
