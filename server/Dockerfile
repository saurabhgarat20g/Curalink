# Use Node 20 as base
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
# Copies package.json and package-lock.json
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD [ "node", "index.js" ]
