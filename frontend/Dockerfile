FROM node:22-alpine

WORKDIR /app

# Copy configuration files
COPY package.json tsconfig.json next.config.ts ./

# Install frontend dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

# Start Next.js production server
CMD ["npm", "start"]
