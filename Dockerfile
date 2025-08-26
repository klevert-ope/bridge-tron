# Dockerfile for nginx static file serving

# Step 1: Use a Node.js image to build the app
FROM node:24 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Build the app
RUN npm run build

# Step 2: Use nginx to serve static files
FROM nginx:alpine

# Copy the build files from the builder stage to nginx's default directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if it exists
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 