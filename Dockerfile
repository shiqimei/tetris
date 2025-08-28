# Use official Node.js runtime as base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json first to leverage Docker layer caching
COPY package.json ./

# Install dependencies (minimal since we're using only Node.js built-ins)
RUN npm install --production

# Copy application source code
COPY src/ ./src/

# Copy any additional files needed
COPY .gitignore ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tetris -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R tetris:nodejs /app

# Switch to non-root user
USER tetris

# No port exposure needed for CLI application

# Set environment variables
ENV NODE_ENV=production
ENV TERM=xterm-256color

# Add health check for CLI app
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Set default command to start the game
CMD ["node", "src/index.js"]