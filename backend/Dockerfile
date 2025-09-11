# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

ENV NODE_ENV=production
# Default port; can be overridden
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
