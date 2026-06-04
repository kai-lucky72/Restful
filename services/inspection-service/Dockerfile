# Build context MUST be the repo root.
#   docker build -f services/inspection-service/Dockerfile -t fes-inspection .
FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
COPY services/inspection-service/package*.json /app/services/inspection-service/
WORKDIR /app/services/inspection-service
RUN npm install --omit=dev
COPY services/inspection-service/src /app/services/inspection-service/src
ENV NODE_ENV=production
EXPOSE 4004
CMD ["node", "src/server.js"]
