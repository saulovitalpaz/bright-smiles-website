FROM node:20-alpine

# Install OpenSSL for Prisma and update npm
RUN apk add --no-cache openssl && npm install -g npm@latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
