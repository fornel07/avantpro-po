FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci -w apps/api --include-workspace-root

COPY apps/api ./apps/api

WORKDIR /app/apps/api

ENV DATABASE_URL=postgresql://avantpro:avantpro@postgres:5432/avantpro_po?schema=public

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
