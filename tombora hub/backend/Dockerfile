FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
