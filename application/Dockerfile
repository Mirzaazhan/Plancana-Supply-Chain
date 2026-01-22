# Repository: https://github.com/Mirzaazhan/Plancana-Supply-Chain
# WIF3005 Alternative Assessment - Agricultural Supply Chain Backend

FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema first (for generation)
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose the application port
EXPOSE 3000

# Health check (uses root endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]