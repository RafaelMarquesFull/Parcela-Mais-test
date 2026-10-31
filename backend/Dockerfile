FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN npm ci --workspace backend --workspace shared --ignore-scripts --omit=dev
COPY shared shared
COPY backend backend
RUN cd backend && npx prisma generate
WORKDIR /app/backend
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx src/main.ts"]
