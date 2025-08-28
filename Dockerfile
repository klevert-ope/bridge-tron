# Dockerfile for nginx static file serving with enhanced security

# Step 1: Use a Node.js image to build the app
FROM node:24-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the app's source code
COPY . .

# Build the app
RUN npm run build

# Step 2: Use nginx to serve static files with security enhancements
FROM nginx:alpine

# Install security updates and remove unnecessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy the build files from the builder stage to nginx's default directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories with proper permissions
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose both HTTP and HTTPS ports
EXPOSE 80 443

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 