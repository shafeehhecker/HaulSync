FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads/pods

RUN npx prisma generate

EXPOSE 5000

CMD ["node", "server.js"]
