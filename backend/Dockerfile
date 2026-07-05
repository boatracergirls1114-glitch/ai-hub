FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate
EXPOSE 3001
CMD sh -c "npx prisma db push && node prisma/seed.js && npm start"
