FROM node:22-alpine

WORKDIR /app

# Copy only the dependency files first so this layer is cached
COPY package*.json ./
RUN npm ci --omit=dev

# Then the source code
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# Run as the built-in non-root user
USER node

# Docker marks the container "healthy" when /health answers
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]