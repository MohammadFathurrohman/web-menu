FROM node:18-alpine

# Install postgresql-client for pg_isready (healthcheck/wait)
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Copy and set up entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
