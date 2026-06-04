# Build context MUST be the repo root.
#   docker build -f services/reporting-service/Dockerfile -t fes-reporting .
FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
COPY services/reporting-service/package*.json /app/services/reporting-service/
WORKDIR /app/services/reporting-service
RUN npm install --omit=dev
COPY services/reporting-service/src /app/services/reporting-service/src
ENV NODE_ENV=production
EXPOSE 4005
CMD ["node", "src/server.js"]
