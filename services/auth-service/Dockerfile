# Build context MUST be the repo root so we can COPY the shared lib.
#   docker build -f services/auth-service/Dockerfile -t fes-auth .
FROM node:20-alpine
WORKDIR /app

# Shared lib first (the file: dependency resolves to ../../shared).
COPY shared /app/shared

# Service manifest + install (preserve services/<name> path so file:../../shared resolves).
COPY services/auth-service/package*.json /app/services/auth-service/
WORKDIR /app/services/auth-service
RUN npm install --omit=dev

# Service source.
COPY services/auth-service/src /app/services/auth-service/src

ENV NODE_ENV=production
EXPOSE 4001
CMD ["node", "src/server.js"]
