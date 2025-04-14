FROM node:latest

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8001
CMD ["sh", "-c", "npm run migrate && npm run start:all"]
