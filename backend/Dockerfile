FROM node:22-alpine

WORKDIR /app

# Copy configuration files
COPY package.json tsconfig.json ./

# Install backend dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 8000

# Start production server
CMD ["npm", "start"]
