FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install --omit=dev

# Copy source
COPY src/ ./src/

EXPOSE 3092

CMD ["node", "src/index.js"]
