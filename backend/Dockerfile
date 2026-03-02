# Use the official Playwright image which has all browser dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# HuggingFace Spaces runs as user 1000, not root
# We need to set up permissions correctly
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy all backend source files
COPY . .

# Give ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user (required by HuggingFace)
USER appuser

# HuggingFace Spaces uses port 7860 by default
# Our app will listen on this port in production
EXPOSE 7860

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=7860

# Start the backend server
CMD ["node", "server.js"]
