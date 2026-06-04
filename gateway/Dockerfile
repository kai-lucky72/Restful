# Build context MUST be the repo root (gateway depends on file:../shared).
#   docker build -f gateway/Dockerfile -t fes-gateway .
FROM node:20-alpine
WORKDIR /app
COPY shared /app/shared
COPY gateway/package*.json /app/gateway/
WORKDIR /app/gateway
RUN npm install --omit=dev
COPY gateway/src /app/gateway/src
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
